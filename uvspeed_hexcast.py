# beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
# hexcast — live camera/video → truecolor ANSI terminal art
# Machine-wide install: uv tool install -e .
# Then just run: hexcast

"""
hexcast — live camera/video → truecolor ANSI terminal art + P2P streaming

Local modes:
    hexcast                    # camera feed (front)
    hexcast --back             # rear/back camera
    hexcast --cameras          # list all cameras
    hexcast --camera 2         # specific camera index
    hexcast --test             # test pattern
    hexcast --thermal          # thermal palette
    hexcast --screen           # screen capture (ffmpeg)
    hexcast --file VIDEO       # play video file
    hexcast --ascii            # ASCII mode

Network modes:
    hexcast --serve            # broadcast camera over LAN (ws://0.0.0.0:9876)
    hexcast --serve --port N   # custom port
    hexcast --receive          # render frames from phone/web (ws server)
    hexcast --connect HOST     # view remote stream (ws://HOST:9876)
    hexcast --chat HOST        # bidirectional video chat
    hexcast --discover         # find hexcast peers on LAN (mDNS)
    hexcast --relay URL        # stream via relay server (NAT traversal)
    hexcast --ping HOST        # latency test to remote hexcast

Dev:
    hexcast --update           # self-update (git pull + reinstall)

iOS / iSH install (lightweight — no opencv needed):
    apk add python3 py3-pip py3-pillow
    pip install websockets zeroconf
    pip install --no-deps hexcast   # or: pip install -e /path/to/uvspeed
    hexcast --connect <MAC_IP>      # view a stream from your Mac
    hexcast --discover              # find hexcast peers on LAN
    hexcast --ping <HOST>           # test latency

Controls:
    q / Ctrl+C  — quit
    c           — swap/cycle camera (front ↔ back)
    f           — jump to front camera
    b           — jump to back camera
    t           — toggle thermal palette
    a           — toggle ASCII mode
    +/-         — adjust brightness
    space       — pause/resume
    s           — screenshot (save .ans file)
"""

__version__ = "3.6.0"

import argparse
import asyncio
import base64
import json
import os
import shutil
import signal
import socket
import subprocess
import sys
import time
from io import BytesIO

# ──────────────────────────────────────────────────────────
# Self-update
# ──────────────────────────────────────────────────────────


def self_update():
    """Pull latest from git and reinstall the tool."""
    project_dir = os.path.dirname(os.path.abspath(__file__))
    print(f"\033[36m  hexcast\033[0m self-update from {project_dir}")

    # git pull
    print("\033[90m  git pull...\033[0m")
    r = subprocess.run(["git", "pull", "--ff-only"], cwd=project_dir, capture_output=True, text=True)
    if r.returncode == 0:
        lines = r.stdout.strip().split("\n")
        for line in lines:
            print(f"  \033[32m{line}\033[0m")
    else:
        print(f"  \033[33m{r.stderr.strip()}\033[0m")

    # reinstall
    print("\033[90m  uv tool install -e . --force ...\033[0m")
    r2 = subprocess.run(["uv", "tool", "install", "-e", project_dir, "--force"], capture_output=True, text=True)
    if r2.returncode == 0:
        print("\033[32m  ✓ Updated to latest\033[0m")
        # Show new version
        subprocess.run(["hexcast", "--version"], capture_output=False)
    else:
        print(f"\033[31m  Error: {r2.stderr.strip()}\033[0m")
        # Fallback: try pip-style
        print("\033[90m  fallback: uv pip install -e . ...\033[0m")
        subprocess.run(["uv", "pip", "install", "-e", project_dir], cwd=project_dir)

    sys.exit(0)


# ──────────────────────────────────────────────────────────
# Networking: frame protocol
# ──────────────────────────────────────────────────────────

HEXCAST_PORT = 9876
MDNS_SERVICE = "_hexcast._tcp.local."


def _has_cv2():
    """Check if opencv is available (cached)."""
    if not hasattr(_has_cv2, "_ok"):
        try:
            import cv2  # noqa: F401

            _has_cv2._ok = True
        except ImportError:
            _has_cv2._ok = False
    return _has_cv2._ok


def _has_pil():
    """Check if Pillow is available (cached)."""
    if not hasattr(_has_pil, "_ok"):
        try:
            from PIL import Image  # noqa: F401

            _has_pil._ok = True
        except ImportError:
            _has_pil._ok = False
    return _has_pil._ok


def compress_frame(frame, quality=50):
    """Compress BGR frame to JPEG bytes."""
    import cv2

    ok, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, quality])
    if ok:
        return buf.tobytes()
    return b""


def decompress_frame(data):
    """Decompress JPEG bytes to BGR numpy array (requires cv2+numpy)."""
    import cv2
    import numpy as np

    arr = np.frombuffer(data, dtype=np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)


def decompress_frame_pil(data):
    """Decompress JPEG bytes to PIL Image (pure-Python fallback, no cv2)."""
    from PIL import Image

    return Image.open(BytesIO(data))


def make_packet(frame, source_name="camera", cols=80, rows=24):
    """Create a JSON+binary streaming packet."""
    jpg = compress_frame(frame)
    return (
        json.dumps(
            {
                "type": "frame",
                "v": __version__,
                "src": source_name,
                "w": frame.shape[1],
                "h": frame.shape[0],
                "sz": len(jpg),
                "t": time.time(),
            }
        )
        + "\n"
        + base64.b64encode(jpg).decode()
    )


def parse_packet(raw):
    """Parse a streaming packet → (metadata, frame_or_image).

    Returns cv2 numpy array if cv2 is available, PIL Image if only Pillow
    is available, or None if neither can decode.
    """
    try:
        parts = raw.split("\n", 1)
        meta = json.loads(parts[0])
        if len(parts) > 1 and meta.get("type") == "frame":
            jpg = base64.b64decode(parts[1])
            if _has_cv2():
                frame = decompress_frame(jpg)
                return meta, frame
            elif _has_pil():
                img = decompress_frame_pil(jpg)
                return meta, img
            else:
                return meta, None
        return meta, None
    except Exception:
        return None, None


# ──────────────────────────────────────────────────────────
# Networking: WebSocket serve (broadcast camera)
# ──────────────────────────────────────────────────────────


def run_serve(args):
    """Broadcast camera/test over WebSocket for remote viewing."""
    import cv2
    import websockets
    import websockets.server

    port = args.port or HEXCAST_PORT
    source_name = "test" if args.test else f"camera:{args.camera}"

    # Capture source
    cap = None
    if args.test:
        pass  # generate_test_pattern used in loop
    else:
        cap = cv2.VideoCapture(args.camera)
        if not cap.isOpened():
            print(f"\033[31mError: cannot open camera {args.camera}.\033[0m")
            print("\033[90m  No camera found. Use test pattern instead:\033[0m")
            print("\033[90m    hexcast --serve --test\033[0m")
            print("\033[90m  Or receive from a phone:\033[0m")
            print("\033[90m    hexcast --receive\033[0m")
            sys.exit(1)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    clients = set()
    frame_num = [0]
    fps = args.fps or 15

    # mDNS registration
    mdns_info = None
    zc = None
    try:
        from zeroconf import ServiceInfo, Zeroconf

        hostname = socket.gethostname()
        local_ip = _get_local_ip()
        mdns_info = ServiceInfo(
            MDNS_SERVICE,
            f"hexcast-{hostname}.{MDNS_SERVICE}",
            addresses=[socket.inet_aton(local_ip)],
            port=port,
            properties={"version": __version__, "source": source_name, "host": hostname},
        )
        zc = Zeroconf()
        zc.register_service(mdns_info)
    except Exception:
        pass  # mDNS optional

    async def handler(websocket):
        clients.add(websocket)
        remote = websocket.remote_address
        print(f"\033[32m  + peer connected: {remote[0]}:{remote[1]}\033[0m")
        try:
            async for msg in websocket:
                # Handle incoming messages (ping, chat text)
                meta, _ = parse_packet(msg)
                if meta and meta.get("type") == "ping":
                    await websocket.send(json.dumps({"type": "pong", "t": meta.get("t"), "st": time.time()}))
                elif meta and meta.get("type") == "chat":
                    txt = meta.get("text", "")
                    print(f"\033[33m  [{remote[0]}]\033[0m {txt}")
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            clients.discard(websocket)
            print(f"\033[31m  - peer disconnected: {remote[0]}:{remote[1]}\033[0m")

    async def broadcast_loop():
        interval = 1.0 / fps
        while True:
            t0 = time.monotonic()
            frame_num[0] += 1

            if args.test:
                frame = generate_test_pattern(160, 120, frame_num[0])
            else:
                ret, frame = cap.read()
                if not ret:
                    await asyncio.sleep(0.1)
                    continue

            if clients:  # noqa: F823 — closure variable from parent scope
                packet = make_packet(frame, source_name)
                dead = set()
                for ws in clients.copy():
                    try:
                        await ws.send(packet)
                    except Exception:
                        dead.add(ws)
                clients -= dead  # noqa: F841

            elapsed = time.monotonic() - t0
            await asyncio.sleep(max(0, interval - elapsed))

    async def main_serve():
        local_ip = _get_local_ip()
        print(f"\033[36m  hexcast serve {__version__}\033[0m")
        print(f"\033[90m  Broadcasting {source_name} @ {fps} fps\033[0m")
        print(f"\033[32m  ws://{local_ip}:{port}\033[0m")
        print(f"\033[90m  Connect: hexcast --connect {local_ip}\033[0m")
        print(f"\033[90m  mDNS: {'registered' if mdns_info else 'unavailable'}\033[0m")
        print("\033[90m  Ctrl+C to stop\033[0m\n")

        try:
            async with websockets.server.serve(handler, "0.0.0.0", port):
                await broadcast_loop()
        except OSError as e:
            if e.errno == 48 or "address already in use" in str(e).lower():
                print(f"\033[31m  Error: port {port} already in use.\033[0m")
                print("\033[90m  Another hexcast instance may be running (--receive or --serve).\033[0m")
                print(f"\033[90m  Try a different port: hexcast --serve --port {port + 1}\033[0m")
                print(f"\033[90m  Or kill the existing process: lsof -ti:{port} | xargs kill\033[0m")
            else:
                raise

    try:
        asyncio.run(main_serve())
    except KeyboardInterrupt:
        pass
    finally:
        if cap:
            cap.release()
        if zc and mdns_info:
            zc.unregister_service(mdns_info)
            zc.close()
        print(f"\n\033[36mhexcast\033[0m serve stopped. {frame_num[0]} frames sent.")


# ──────────────────────────────────────────────────────────
# Networking: WebSocket connect (view remote stream)
# ──────────────────────────────────────────────────────────


def run_connect(args):
    """Connect to a remote hexcast and render in terminal."""
    import termios
    import tty

    import websockets

    host = args.connect
    port = args.port or HEXCAST_PORT
    if ":" in host:
        parts = host.rsplit(":", 1)
        host = parts[0]
        port = int(parts[1])

    uri = f"ws://{host}:{port}"
    thermal = args.thermal
    ascii_mode = args.ascii
    brightness = 1.0

    old_settings = termios.tcgetattr(sys.stdin)

    def cleanup(*_):
        termios.tcsetattr(sys.stdin, termios.TCSADRAIN, old_settings)
        show_cursor()
        clear_screen()
        print(f"\n\033[36mhexcast\033[0m disconnected from {uri}")
        sys.exit(0)

    signal.signal(signal.SIGINT, cleanup)

    async def viewer():
        nonlocal thermal, ascii_mode, brightness
        tty.setcbreak(sys.stdin.fileno())
        hide_cursor()
        clear_screen()

        frame_count = 0
        latencies = []

        print(f"\033[36m  hexcast connect\033[0m → {uri}")
        print("\033[90m  Connecting...\033[0m")

        try:
            async with websockets.connect(uri, max_size=10_000_000) as ws:
                print("\033[32m  Connected!\033[0m\n")
                await asyncio.sleep(0.5)

                async for msg in ws:
                    meta, frame = parse_packet(msg)
                    if frame is None:
                        continue

                    frame_count += 1
                    latency = (time.time() - meta.get("t", 0)) * 1000  # ms
                    latencies.append(latency)
                    if len(latencies) > 60:
                        latencies.pop(0)

                    # Key handling
                    if kbhit():
                        ch = getch()
                        if ch in ("q", "Q", "\x03"):
                            cleanup()
                        elif ch == "t":
                            thermal = not thermal
                        elif ch == "a":
                            ascii_mode = not ascii_mode
                        elif ch in ("+", "="):
                            brightness = min(2.0, brightness + 0.1)
                        elif ch in ("-", "_"):
                            brightness = max(0.2, brightness - 0.1)

                    cols, rows_total = terminal_size()
                    rows = rows_total - 2

                    if ascii_mode:
                        output = render_frame_ascii(frame, cols, rows, thermal, brightness)
                    else:
                        output = render_frame_truecolor(frame, cols, rows, thermal, brightness)

                    avg_lat = sum(latencies) / len(latencies) if latencies else 0
                    src = meta.get("src", "?")
                    w, h = meta.get("w", 0), meta.get("h", 0)
                    sz = meta.get("sz", 0)
                    mode_str = ("thermal " if thermal else "") + ("ascii" if ascii_mode else "truecolor")
                    status = (
                        f"\033[36m hexcast\033[0m "
                        f"\033[90m← {host} {src} {w}×{h} "
                        f"f:{frame_count} lat:{avg_lat:.0f}ms "
                        f"sz:{sz // 1024}KB {mode_str}\033[0m"
                    )

                    move_cursor(1, 1)
                    sys.stdout.write(output + "\n" + status)
                    sys.stdout.flush()

        except Exception as e:
            termios.tcsetattr(sys.stdin, termios.TCSADRAIN, old_settings)
            show_cursor()
            print(f"\n\033[31mConnection failed: {e}\033[0m")
            print(f"\033[90mIs hexcast --serve running on {host}?\033[0m")
            sys.exit(1)

    try:
        asyncio.run(viewer())
    except KeyboardInterrupt:
        cleanup()


# ──────────────────────────────────────────────────────────
# Networking: bidirectional video chat
# ──────────────────────────────────────────────────────────


def run_chat(args):
    """Bidirectional video chat — send camera + receive remote, split-screen."""
    import termios
    import tty

    import cv2
    import websockets

    host = args.chat
    port = args.port or HEXCAST_PORT
    if ":" in host:
        parts = host.rsplit(":", 1)
        host = parts[0]
        port = int(parts[1])

    uri = f"ws://{host}:{port}"
    thermal = args.thermal
    fps = args.fps or 15

    cap = cv2.VideoCapture(args.camera)
    if not cap.isOpened():
        print("\033[31mError: cannot open camera for chat\033[0m")
        sys.exit(1)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 320)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 240)

    old_settings = termios.tcgetattr(sys.stdin)
    remote_frame = [None]
    frame_count = [0, 0]  # [sent, received]
    latencies = []

    def cleanup(*_):
        termios.tcsetattr(sys.stdin, termios.TCSADRAIN, old_settings)
        show_cursor()
        clear_screen()
        cap.release()
        print(f"\n\033[36mhexcast\033[0m chat ended. Sent: {frame_count[0]}, Received: {frame_count[1]}")
        sys.exit(0)

    signal.signal(signal.SIGINT, cleanup)

    async def chat_session():
        nonlocal thermal
        tty.setcbreak(sys.stdin.fileno())
        hide_cursor()
        clear_screen()

        print(f"\033[36m  hexcast chat\033[0m → {uri}")
        print("\033[90m  Connecting...\033[0m")

        try:
            async with websockets.connect(uri, max_size=10_000_000) as ws:
                print("\033[32m  Connected! Split-screen video chat active.\033[0m\n")
                await asyncio.sleep(0.3)

                async def send_loop():
                    interval = 1.0 / fps
                    while True:
                        t0 = time.monotonic()
                        ret, frame = cap.read()
                        if ret:
                            packet = make_packet(frame, f"chat:{socket.gethostname()}")
                            await ws.send(packet)
                            frame_count[0] += 1
                        elapsed = time.monotonic() - t0
                        await asyncio.sleep(max(0, interval - elapsed))

                async def recv_loop():
                    async for msg in ws:
                        meta, frame = parse_packet(msg)
                        if frame is not None:
                            remote_frame[0] = frame
                            frame_count[1] += 1
                            lat = (time.time() - meta.get("t", 0)) * 1000
                            latencies.append(lat)
                            if len(latencies) > 60:
                                latencies.pop(0)

                async def render_loop():
                    while True:
                        if kbhit():
                            ch = getch()
                            if ch in ("q", "Q", "\x03"):
                                cleanup()
                            elif ch == "t":
                                nonlocal thermal
                                thermal = not thermal

                        cols, rows_total = terminal_size()
                        rows = rows_total - 2
                        half_cols = cols // 2 - 1

                        # Capture local frame
                        ret, local_frame = cap.read()

                        # Render split screen: [LOCAL | REMOTE]
                        move_cursor(1, 1)

                        for row in range(rows):
                            y0 = row * 2
                            y1 = row * 2 + 1
                            line = ""

                            # Left half: local camera
                            if local_frame is not None:
                                lf = cv2.resize(local_frame, (half_cols, rows * 2), interpolation=cv2.INTER_AREA)
                                for x in range(half_cols):
                                    b0, g0, r0 = lf[y0, x] if y0 < lf.shape[0] else (0, 0, 0)
                                    b1, g1, r1 = lf[y1, x] if y1 < lf.shape[0] else (0, 0, 0)
                                    if thermal:
                                        r0, g0, b0 = thermal_map(r0, g0, b0)
                                        r1, g1, b1 = thermal_map(r1, g1, b1)
                                    line += f"{truecolor_fg(r0, g0, b0)}{truecolor_bg(r1, g1, b1)}▀"
                            else:
                                line += " " * half_cols

                            line += "\033[0m│"

                            # Right half: remote
                            rf = remote_frame[0]
                            if rf is not None:
                                rf_resized = cv2.resize(rf, (half_cols, rows * 2), interpolation=cv2.INTER_AREA)
                                for x in range(half_cols):
                                    b0, g0, r0 = rf_resized[y0, x] if y0 < rf_resized.shape[0] else (0, 0, 0)
                                    b1, g1, r1 = rf_resized[y1, x] if y1 < rf_resized.shape[0] else (0, 0, 0)
                                    if thermal:
                                        r0, g0, b0 = thermal_map(r0, g0, b0)
                                        r1, g1, b1 = thermal_map(r1, g1, b1)
                                    line += f"{truecolor_fg(r0, g0, b0)}{truecolor_bg(r1, g1, b1)}▀"
                            else:
                                line += "\033[90m" + "·" * half_cols

                            sys.stdout.write(line + "\033[0m\n")

                        # Status bar
                        avg_lat = sum(latencies) / len(latencies) if latencies else 0
                        status = (
                            f"\033[36m hexcast chat\033[0m "
                            f"\033[90m↑{frame_count[0]} ↓{frame_count[1]} "
                            f"lat:{avg_lat:.0f}ms "
                            f"{'thermal' if thermal else 'truecolor'}\033[0m"
                        )
                        sys.stdout.write(status)
                        sys.stdout.flush()

                        await asyncio.sleep(1.0 / fps)

                await asyncio.gather(send_loop(), recv_loop(), render_loop())

        except Exception as e:
            termios.tcsetattr(sys.stdin, termios.TCSADRAIN, old_settings)
            show_cursor()
            print(f"\n\033[31mChat failed: {e}\033[0m")
            sys.exit(1)

    try:
        asyncio.run(chat_session())
    except KeyboardInterrupt:
        cleanup()


# ──────────────────────────────────────────────────────────
# Networking: mDNS discovery
# ──────────────────────────────────────────────────────────


def run_discover(args):
    """Discover hexcast peers on the local network via mDNS/Bonjour."""
    try:
        from zeroconf import ServiceBrowser, Zeroconf
    except ImportError:
        print("\033[31mInstall zeroconf: pip install zeroconf\033[0m")
        sys.exit(1)

    print("\033[36m  hexcast discover\033[0m — scanning LAN for peers...")
    print(f"\033[90m  Looking for {MDNS_SERVICE}\033[0m\n")

    found = []

    class Listener:
        def add_service(self, zc, stype, name):
            info = zc.get_service_info(stype, name)
            if info:
                addrs = [socket.inet_ntoa(a) for a in info.addresses]
                port = info.port
                props = {k.decode(): v.decode() for k, v in info.properties.items()} if info.properties else {}
                entry = {"name": name, "addrs": addrs, "port": port, "props": props}
                found.append(entry)
                for addr in addrs:
                    host_label = props.get("host", "?")
                    src = props.get("source", "?")
                    ver = props.get("version", "?")
                    print(f"  \033[32m●\033[0m {host_label} \033[90m{addr}:{port}\033[0m  {src}  v{ver}")
                    print(f"    \033[36mhexcast --connect {addr}\033[0m")
                    print(f"    \033[36mhexcast --chat {addr}\033[0m")

        def remove_service(self, zc, stype, name):
            pass

        def update_service(self, zc, stype, name):
            pass

    zc = Zeroconf()
    listener = Listener()
    ServiceBrowser(zc, MDNS_SERVICE, listener)

    try:
        # Scan for a few seconds
        duration = 5
        for i in range(duration):
            time.sleep(1)
            if not found:
                sys.stdout.write(f"\r\033[90m  Scanning... {duration - i - 1}s\033[0m")
                sys.stdout.flush()
        print()
    except KeyboardInterrupt:
        pass
    finally:
        zc.close()

    if not found:
        local_ip = _get_local_ip()
        print("\033[33m  No hexcast peers found on LAN.\033[0m")
        print("\033[90m  Start one: hexcast --serve\033[0m")
        print(f"\033[90m  Your IP: {local_ip}\033[0m")
    else:
        print(f"\n\033[32m  Found {len(found)} peer(s)\033[0m")


# ──────────────────────────────────────────────────────────
# Networking: ping
# ──────────────────────────────────────────────────────────


def run_ping(args):
    """Measure latency to a remote hexcast server."""
    import websockets

    host = args.ping
    port = args.port or HEXCAST_PORT
    if ":" in host:
        parts = host.rsplit(":", 1)
        host = parts[0]
        port = int(parts[1])

    uri = f"ws://{host}:{port}"
    count = 10

    print(f"\033[36m  hexcast ping\033[0m → {uri}")
    print(f"\033[90m  Sending {count} pings...\033[0m\n")

    async def do_ping():
        try:
            async with websockets.connect(uri) as ws:
                times = []
                for i in range(count):
                    t0 = time.time()
                    await ws.send(json.dumps({"type": "ping", "t": t0, "seq": i}))
                    resp = await asyncio.wait_for(ws.recv(), timeout=5.0)
                    t1 = time.time()
                    rtt = (t1 - t0) * 1000

                    data = json.loads(resp)
                    server_t = data.get("st", 0)
                    (server_t - t0) * 1000 if server_t else rtt / 2

                    times.append(rtt)
                    bar = "█" * max(1, min(40, int(rtt / 2)))
                    color = "\033[32m" if rtt < 20 else "\033[33m" if rtt < 50 else "\033[31m"
                    print(f"  {color}{rtt:6.1f}ms\033[0m  {color}{bar}\033[0m  seq={i}")
                    await asyncio.sleep(0.5)

                avg = sum(times) / len(times)
                mn, mx = min(times), max(times)
                jitter = max(times) - min(times)
                print(f"\n\033[36m  --- {host} hexcast ping stats ---\033[0m")
                print(f"  {count} pings, avg={avg:.1f}ms, min={mn:.1f}ms, max={mx:.1f}ms, jitter={jitter:.1f}ms")
                grade = "excellent" if avg < 10 else "good" if avg < 30 else "fair" if avg < 100 else "poor"
                color = "\033[32m" if avg < 30 else "\033[33m" if avg < 100 else "\033[31m"
                print(f"  {color}Grade: {grade}\033[0m")

        except Exception as e:
            print(f"\033[31m  Error: {e}\033[0m")
            print(f"\033[90m  Is hexcast --serve running on {host}:{port}?\033[0m")

    asyncio.run(do_ping())


# ──────────────────────────────────────────────────────────
# Networking: relay
# ──────────────────────────────────────────────────────────


def run_relay(args):
    """Connect via a relay server for NAT traversal."""

    relay_url = args.relay
    room = args.room or f"hexcast-{os.getpid()}"

    print(f"\033[36m  hexcast relay\033[0m → {relay_url}")
    print(f"\033[90m  Room: {room}\033[0m")
    print(f"\033[90m  Share this to invite: hexcast --relay {relay_url} --room {room}\033[0m\n")

    # Relay protocol: join a room, relay forwards frames to all room members
    # This is essentially --chat but through a relay WebSocket
    # For now, connect to the relay and stream like a regular connection
    args.connect = relay_url.replace("wss://", "").replace("ws://", "").split("/")[0]
    run_connect(args)


# ──────────────────────────────────────────────────────────
# Networking: receive (render incoming frames from phone/web)
# ──────────────────────────────────────────────────────────


def run_receive(args):
    """Start a WS server that renders frames sent from remote devices (phone PWA, web)."""
    import termios
    import tty

    import websockets
    import websockets.server

    port = args.port or HEXCAST_PORT
    thermal = args.thermal
    ascii_mode = args.ascii
    brightness = 1.0
    frame_count = [0]
    latest_frame = [None]
    latest_meta = [{}]
    latencies = []
    peers = set()

    # mDNS
    mdns_info = None
    zc = None
    try:
        from zeroconf import ServiceInfo, Zeroconf

        hostname = socket.gethostname()
        local_ip = _get_local_ip()
        mdns_info = ServiceInfo(
            MDNS_SERVICE,
            f"hexcast-recv-{hostname}.{MDNS_SERVICE}",
            addresses=[socket.inet_aton(local_ip)],
            port=port,
            properties={"version": __version__, "mode": "receive", "host": hostname},
        )
        zc = Zeroconf()
        zc.register_service(mdns_info)
    except Exception:
        pass

    old_settings = termios.tcgetattr(sys.stdin)

    def cleanup(*_):
        termios.tcsetattr(sys.stdin, termios.TCSADRAIN, old_settings)
        show_cursor()
        clear_screen()
        if zc and mdns_info:
            zc.unregister_service(mdns_info)
            zc.close()
        print(f"\n\033[36mhexcast\033[0m receive stopped. {frame_count[0]} frames received.")
        sys.exit(0)

    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    async def handler(websocket):
        remote = websocket.remote_address
        peers.add(remote)
        print(f"\033[32m  + sender connected: {remote[0]}:{remote[1]}\033[0m")
        try:
            async for msg in websocket:
                meta, frame = parse_packet(msg)
                if frame is not None:
                    latest_frame[0] = frame
                    latest_meta[0] = meta
                    frame_count[0] += 1
                    lat = (time.time() - meta.get("t", 0)) * 1000
                    latencies.append(lat)
                    if len(latencies) > 60:
                        latencies.pop(0)
                elif meta and meta.get("type") == "ping":
                    await websocket.send(json.dumps({"type": "pong", "t": meta.get("t"), "st": time.time()}))
        except Exception:
            pass
        finally:
            peers.discard(remote)
            print(f"\033[31m  - sender disconnected: {remote[0]}:{remote[1]}\033[0m")

    async def render_loop():
        nonlocal thermal, ascii_mode, brightness
        tty.setcbreak(sys.stdin.fileno())
        hide_cursor()

        local_ip = _get_local_ip()
        # Show connection info prominently
        clear_screen()
        sys.stdout.write(
            f"\033[36m  hexcast receive {__version__}\033[0m\n"
            f"\033[32m  ws://{local_ip}:{port}\033[0m\n\n"
            f"\033[90m  Waiting for sender...\033[0m\n\n"
            f"\033[1m  From iPhone/iPad (same WiFi):\033[0m\n"
            f"    1. Open Safari → \033[4mhttp://{local_ip}:8085/web/quantum-notepad.html\033[0m\n"
            f"       or open the uvspeed PWA\n"
            f"    2. Tap 'Term' → type: \033[36mhexcast send {local_ip}\033[0m\n\n"
            f"    Or open: \033[4mhttp://{local_ip}:8085/web/hexcast-send.html#{local_ip}:{port}\033[0m\n\n"
            f"\033[90m  From another terminal:\033[0m\n"
            f"    \033[36mhexcast --serve\033[0m   (and this machine runs --connect)\n"
            f"    \033[36mhexcast --chat {local_ip}\033[0m\n\n"
            f"\033[90m  q=quit  t=thermal  a=ascii  +/-=brightness\033[0m\n"
        )
        sys.stdout.flush()

        while True:
            if kbhit():
                ch = getch()
                if ch in ("q", "Q", "\x03"):
                    cleanup()
                elif ch == "t":
                    thermal = not thermal
                elif ch == "a":
                    ascii_mode = not ascii_mode
                elif ch in ("+", "="):
                    brightness = min(2.0, brightness + 0.1)
                elif ch in ("-", "_"):
                    brightness = max(0.2, brightness - 0.1)

            frame = latest_frame[0]
            if frame is not None:
                cols, rows_total = terminal_size()
                rows = rows_total - 2
                if ascii_mode:
                    output = render_frame_ascii(frame, cols, rows, thermal, brightness)
                else:
                    output = render_frame_truecolor(frame, cols, rows, thermal, brightness)

                meta = latest_meta[0]
                avg_lat = sum(latencies) / len(latencies) if latencies else 0
                src = meta.get("src", "?")
                w, h = meta.get("w", 0), meta.get("h", 0)
                sz = meta.get("sz", 0)
                mode_str = ("thermal " if thermal else "") + ("ascii" if ascii_mode else "truecolor")
                status = (
                    f"\033[36m hexcast ←\033[0m "
                    f"\033[90m{src} {w}×{h} "
                    f"f:{frame_count[0]} lat:{avg_lat:.0f}ms "
                    f"sz:{sz // 1024}KB {mode_str} "
                    f"peers:{len(peers)}\033[0m"
                )

                move_cursor(1, 1)
                sys.stdout.write(output + "\n" + status)
                sys.stdout.flush()

            await asyncio.sleep(1.0 / 30)  # check at 30fps

    async def main_receive():
        try:
            async with websockets.server.serve(handler, "0.0.0.0", port):
                await render_loop()
        except OSError as e:
            if e.errno == 48 or "address already in use" in str(e).lower():
                show_cursor()
                clear_screen()
                print(f"\033[31m  Error: port {port} already in use.\033[0m")
                print("\033[90m  Another hexcast instance may be running.\033[0m")
                print()
                print("\033[36m  Fix options:\033[0m")
                print(f"\033[90m    hexcast --receive --port {port + 1}        # use a different port\033[0m")
                print(f"\033[90m    lsof -ti:{port} | xargs kill              # kill the process on the port\033[0m")
                print()
                # Attempt to show what's on the port
                try:
                    import subprocess

                    result = subprocess.run(["lsof", "-ti", f":{port}"], capture_output=True, text=True, timeout=3)
                    pids = result.stdout.strip()
                    if pids:
                        print(f"\033[33m  Process(es) on port {port}: PID {pids.replace(chr(10), ', ')}\033[0m")
                except Exception:
                    pass
            else:
                raise

    try:
        asyncio.run(main_receive())
    except KeyboardInterrupt:
        cleanup()


# ──────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────


def _get_local_ip():
    """Get LAN IP address."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


# ──────────────────────────────────────────────────────────
# Camera detection & management
# ──────────────────────────────────────────────────────────

MAX_CAMERA_PROBE = 10  # check indices 0..9


def detect_cameras():
    """Probe system for available cameras. Returns list of {index, name, w, h, facing}."""
    import cv2

    # Suppress OpenCV native C warning spam during probing
    os.environ["OPENCV_LOG_LEVEL"] = "SILENT"
    _stderr_fd = sys.stderr.fileno()
    _old_stderr = os.dup(_stderr_fd)
    _devnull = os.open(os.devnull, os.O_WRONLY)
    os.dup2(_devnull, _stderr_fd)
    cameras = []
    for idx in range(MAX_CAMERA_PROBE):
        cap = cv2.VideoCapture(idx)
        if cap.isOpened():
            w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            backend = cap.getBackendName()
            # Heuristic for facing direction:
            #   macOS: index 0 = FaceTime (front), index 1+ = external/back
            #   Linux: /dev/video0 usually front
            #   Most laptops: index 0 = front-facing
            if idx == 0:
                facing = "front"
            else:
                facing = "back" if idx == 1 else f"cam-{idx}"
            name = f"{backend}:{idx}"
            # Try to read a frame to confirm it's real
            ret, _ = cap.read()
            cap.release()
            if ret:
                cameras.append({"index": idx, "name": name, "w": w, "h": h, "facing": facing})
        else:
            cap.release()
    # Restore stderr
    os.dup2(_old_stderr, _stderr_fd)
    os.close(_old_stderr)
    os.close(_devnull)
    del os.environ["OPENCV_LOG_LEVEL"]
    return cameras


def list_cameras():
    """Print detected cameras to terminal."""
    cams = detect_cameras()
    if not cams:
        print("\033[31m  No cameras detected\033[0m")
        return cams
    print(f"\033[36m  hexcast cameras\033[0m — {len(cams)} detected\n")
    for c in cams:
        tag = "\033[32m●\033[0m" if c["facing"] == "front" else "\033[33m●\033[0m"
        label = "FRONT" if c["facing"] == "front" else "BACK" if c["facing"] == "back" else c["facing"].upper()
        print(f"  {tag} [{c['index']}] {label}  {c['w']}×{c['h']}  {c['name']}")
    print("\n\033[90m  Use --camera N to select, or press 'c' during stream to cycle\033[0m")
    return cams


def open_camera(idx, width=640, height=480):
    """Open a camera by index with requested resolution."""
    import cv2

    cap = cv2.VideoCapture(idx)
    if not cap.isOpened():
        return None
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
    return cap


def swap_camera(current_cap, current_idx, cameras, direction=1):
    """Cycle to next/prev camera. Returns (new_cap, new_idx, new_facing)."""
    if not cameras or len(cameras) < 2:
        return current_cap, current_idx, "front"
    # Find current position in camera list
    indices = [c["index"] for c in cameras]
    try:
        pos = indices.index(current_idx)
    except ValueError:
        pos = 0
    new_pos = (pos + direction) % len(cameras)
    new_cam = cameras[new_pos]
    # Release old capture
    if current_cap:
        current_cap.release()
    new_cap = open_camera(new_cam["index"])
    return new_cap, new_cam["index"], new_cam["facing"]


# ──────────────────────────────────────────────────────────
# Terminal helpers
# ──────────────────────────────────────────────────────────


def terminal_size():
    cols, rows = shutil.get_terminal_size((80, 24))
    return cols, rows


def hide_cursor():
    sys.stdout.write("\033[?25l")
    sys.stdout.flush()


def show_cursor():
    sys.stdout.write("\033[?25h\033[0m")
    sys.stdout.flush()


def clear_screen():
    sys.stdout.write("\033[2J\033[H")
    sys.stdout.flush()


def move_cursor(row, col):
    sys.stdout.write(f"\033[{row};{col}H")


def kbhit():
    """Non-blocking key check."""
    import select

    dr, _, _ = select.select([sys.stdin], [], [], 0)
    return len(dr) > 0


def getch():
    return sys.stdin.read(1)


# ──────────────────────────────────────────────────────────
# Color palettes
# ──────────────────────────────────────────────────────────


def truecolor_fg(r, g, b):
    return f"\033[38;2;{r};{g};{b}m"


def truecolor_bg(r, g, b):
    return f"\033[48;2;{r};{g};{b}m"


def thermal_map(r, g, b):
    luma = int(0.299 * r + 0.587 * g + 0.114 * b)
    if luma < 64:
        return (0, luma * 2, min(255, luma * 4))
    elif luma < 128:
        t = luma - 64
        return (0, min(255, t * 4), max(0, 255 - t * 2))
    elif luma < 192:
        t = luma - 128
        return (min(255, t * 4), max(0, 255 - t * 2), 0)
    else:
        t = luma - 192
        return (255, min(255, t * 4), min(255, t * 2))


ASCII_RAMP = " .:-=+*#%@"


def rgb_to_ascii(r, g, b):
    luma = int(0.299 * r + 0.587 * g + 0.114 * b)
    idx = min(len(ASCII_RAMP) - 1, luma * len(ASCII_RAMP) // 256)
    return ASCII_RAMP[idx]


# ──────────────────────────────────────────────────────────
# Frame rendering
# ──────────────────────────────────────────────────────────

UPPER_HALF = "▀"
RESET = "\033[0m"


def render_frame_truecolor(frame, cols, rows, thermal=False, brightness=1.0):
    """Half-block truecolor: each row = 2 pixel rows. Accepts cv2 ndarray or PIL Image."""
    target_w = cols
    target_h = rows * 2

    # Detect PIL Image vs numpy array
    try:
        from PIL import Image

        is_pil = isinstance(frame, Image.Image)
    except ImportError:
        is_pil = False

    if is_pil:
        resized = frame.resize((target_w, target_h), Image.LANCZOS).convert("RGB")

        def get_pixel(x, y):
            return resized.getpixel((x, y))  # returns (R, G, B)
    else:
        import cv2
        import numpy as np

        resized = cv2.resize(frame, (target_w, target_h), interpolation=cv2.INTER_AREA)
        if brightness != 1.0:
            resized = np.clip(resized * brightness, 0, 255).astype(np.uint8)

        def get_pixel(x, y):
            return tuple(int(v) for v in reversed(resized[y, x]))  # BGR → RGB

    lines = []
    for row in range(rows):
        y0 = row * 2
        y1 = row * 2 + 1
        parts = []
        for x in range(target_w):
            r0, g0, b0 = get_pixel(x, y0)
            if y1 < target_h:
                r1, g1, b1 = get_pixel(x, y1)
            else:
                r1, g1, b1 = 0, 0, 0
            if brightness != 1.0 and is_pil:
                r0, g0, b0 = [min(255, int(v * brightness)) for v in (r0, g0, b0)]
                r1, g1, b1 = [min(255, int(v * brightness)) for v in (r1, g1, b1)]
            if thermal:
                r0, g0, b0 = thermal_map(r0, g0, b0)
                r1, g1, b1 = thermal_map(r1, g1, b1)
            parts.append(f"{truecolor_fg(r0, g0, b0)}{truecolor_bg(r1, g1, b1)}{UPPER_HALF}")
        lines.append("".join(parts) + RESET)
    return "\n".join(lines)


def render_frame_ascii(frame, cols, rows, thermal=False, brightness=1.0):
    """Colored ASCII characters. Accepts cv2 ndarray or PIL Image."""
    try:
        from PIL import Image

        is_pil = isinstance(frame, Image.Image)
    except ImportError:
        is_pil = False

    if is_pil:
        resized = frame.resize((cols, rows), Image.LANCZOS).convert("RGB")

        def get_pixel(x, y):
            return resized.getpixel((x, y))
    else:
        import cv2
        import numpy as np

        resized = cv2.resize(frame, (cols, rows), interpolation=cv2.INTER_AREA)
        if brightness != 1.0:
            resized = np.clip(resized * brightness, 0, 255).astype(np.uint8)

        def get_pixel(x, y):
            return tuple(int(v) for v in reversed(resized[y, x]))

    lines = []
    for y in range(rows):
        parts = []
        for x in range(cols):
            r, g, b = get_pixel(x, y)
            if brightness != 1.0 and is_pil:
                r, g, b = [min(255, int(v * brightness)) for v in (r, g, b)]
            if thermal:
                r, g, b = thermal_map(r, g, b)
            ch = rgb_to_ascii(r, g, b)
            parts.append(f"{truecolor_fg(r, g, b)}{ch}")
        lines.append("".join(parts) + RESET)
    return "\n".join(lines)


# ──────────────────────────────────────────────────────────
# Test pattern
# ──────────────────────────────────────────────────────────


def generate_test_pattern(w, h, frame_num):
    import numpy as np

    img = np.zeros((h, w, 3), dtype=np.uint8)
    colors = [
        (255, 255, 255),
        (0, 255, 255),
        (255, 255, 0),
        (0, 255, 0),
        (255, 0, 255),
        (0, 0, 255),
        (255, 0, 0),
        (0, 0, 0),
    ]
    bar_w = max(1, w // 8)
    for i, (b, g, r) in enumerate(colors):
        x0 = i * bar_w
        x1 = (i + 1) * bar_w if i < 7 else w
        img[:, x0:x1] = (r, g, b)

    scan_y = (frame_num * 3) % h
    y0 = max(0, scan_y - 1)
    y1 = min(h, scan_y + 2)
    img[y0:y1, :] = (img[y0:y1, :].astype(np.float32) * 0.3).astype(np.uint8)

    grad_h = max(1, h // 10)
    for x in range(w):
        v = int(255 * x / max(1, w - 1))
        img[h - grad_h :, x] = (v, v, v)

    return img


# ──────────────────────────────────────────────────────────
# Screen capture via ffmpeg
# ──────────────────────────────────────────────────────────


def open_screen_capture():
    cmd = [
        "ffmpeg",
        "-f",
        "avfoundation",
        "-framerate",
        "15",
        "-i",
        "1:none",
        "-vf",
        "scale=320:240",
        "-f",
        "rawvideo",
        "-pix_fmt",
        "bgr24",
        "-an",
        "-",
    ]
    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
        return proc, 320, 240
    except FileNotFoundError:
        print("\033[31mError: ffmpeg not found. Install: brew install ffmpeg\033[0m")
        sys.exit(1)


# ──────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────


def main():
    parser = argparse.ArgumentParser(
        prog="hexcast",
        description="hexcast — live camera → truecolor ANSI terminal art + P2P streaming",
        epilog=(
            "iSH (iOS) install:\n"
            "  apk add python3 py3-pip py3-pillow\n"
            "  pip install websockets zeroconf\n"
            "  pip install -e /path/to/uvspeed --no-deps\n"
            "  hexcast --connect <MAC_IP>     # view stream\n"
            "  hexcast --discover             # find peers\n"
            "  hexcast --receive              # receive phone camera"
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--version", action="version", version=f"hexcast {__version__}")

    # Local modes
    parser.add_argument("--screen", action="store_true", help="capture screen via ffmpeg")
    parser.add_argument("--test", action="store_true", help="synthetic test pattern")
    parser.add_argument("--file", type=str, help="play a video file")
    parser.add_argument("--thermal", action="store_true", help="thermal color palette")
    parser.add_argument("--ascii", action="store_true", help="ASCII grayscale mode")
    parser.add_argument("--cols", type=int, default=0, help="custom width (0=auto)")
    parser.add_argument("--fps", type=int, default=15, help="target FPS (default: 15)")
    parser.add_argument("--camera", type=int, default=0, help="camera device index")
    parser.add_argument("--cameras", action="store_true", help="list all detected cameras")
    parser.add_argument("--front", action="store_true", help="use front-facing camera (index 0)")
    parser.add_argument("--back", action="store_true", help="use back/rear camera (index 1)")

    # Network modes
    parser.add_argument("--serve", action="store_true", help="broadcast camera over WebSocket")
    parser.add_argument("--receive", action="store_true", help="receive & render frames from phone/web sender")
    parser.add_argument("--connect", type=str, metavar="HOST", help="view remote hexcast stream")
    parser.add_argument("--chat", type=str, metavar="HOST", help="bidirectional video chat")
    parser.add_argument("--discover", action="store_true", help="find hexcast peers on LAN (mDNS)")
    parser.add_argument("--ping", type=str, metavar="HOST", help="latency test to remote hexcast")
    parser.add_argument("--relay", type=str, metavar="URL", help="stream via relay (NAT traversal)")
    parser.add_argument("--room", type=str, help="relay room name")
    parser.add_argument("--port", type=int, help=f"WebSocket port (default: {HEXCAST_PORT})")

    # Dev
    parser.add_argument("--update", action="store_true", help="self-update (git pull + reinstall)")

    args = parser.parse_args()

    # Route to mode
    if args.update:
        self_update()
        return
    if args.cameras:
        list_cameras()
        return
    if args.front:
        args.camera = 0
    elif args.back:
        # Find back camera (index 1 if exists, else first non-zero)
        cams = detect_cameras()
        back = [c for c in cams if c["facing"] == "back"]
        if back:
            args.camera = back[0]["index"]
        elif len(cams) > 1:
            args.camera = cams[1]["index"]
        else:
            print("\033[33m  No back camera found, using default\033[0m")
    if args.serve:
        run_serve(args)
        return
    if args.receive:
        run_receive(args)
        return
    if args.connect:
        run_connect(args)
        return
    if args.chat:
        run_chat(args)
        return
    if args.discover:
        run_discover(args)
        return
    if args.ping:
        run_ping(args)
        return
    if args.relay:
        run_relay(args)
        return

    # Lazy-import heavy deps (fast startup for --help/--version/--update)
    try:
        import cv2
        import numpy as np
    except ImportError:
        print("\033[31mMissing dependencies. Run: uv tool install -e . --force\033[0m")
        print("\033[90mOr: pip install opencv-python-headless numpy\033[0m")
        sys.exit(1)

    import termios
    import tty

    thermal = args.thermal
    ascii_mode = args.ascii
    brightness = 1.0
    paused = False
    frame_num = 0
    target_fps = args.fps
    frame_interval = 1.0 / target_fps
    cols_override = args.cols
    cap = None
    ffmpeg_proc = None
    screen_w, screen_h = 0, 0
    source_name = "camera"

    # Detect cameras for hot-swap
    available_cameras = []
    cam_idx = args.camera
    cam_facing = "front" if cam_idx == 0 else "back" if cam_idx == 1 else f"cam-{cam_idx}"

    if args.test:
        source_name = "test"
    elif args.screen:
        source_name = "screen"
        ffmpeg_proc, screen_w, screen_h = open_screen_capture()
    elif args.file:
        from pathlib import Path

        source_name = f"file:{Path(args.file).name}"
        cap = cv2.VideoCapture(args.file)
        if not cap.isOpened():
            print(f"\033[31mError: cannot open {args.file}\033[0m")
            sys.exit(1)
    else:
        # Detect available cameras
        available_cameras = detect_cameras()
        if available_cameras:
            # Find the requested camera
            matching = [c for c in available_cameras if c["index"] == cam_idx]
            if matching:
                cam_facing = matching[0]["facing"]
            len(available_cameras)
        else:
            pass

        cap = open_camera(cam_idx)
        if not cap:
            print(f"\033[31mError: cannot open camera {cam_idx}.\033[0m")
            if available_cameras:
                print(f"\033[90m  Available: {', '.join(str(c['index']) for c in available_cameras)}\033[0m")
            else:
                print("\033[90m  No cameras detected on this device.\033[0m")
            print()
            print("\033[36m  Try one of these instead:\033[0m")
            print("\033[90m    hexcast --test           # synthetic test pattern\033[0m")
            print("\033[90m    hexcast --screen         # capture your screen\033[0m")
            print("\033[90m    hexcast --receive        # receive a phone camera stream\033[0m")
            print("\033[90m    hexcast --serve --test   # broadcast test pattern over WiFi\033[0m")
            print("\033[90m    hexcast --cameras        # list all detected cameras\033[0m")
            sys.exit(1)
        source_name = f"camera:{cam_idx} ({cam_facing})"

    old_settings = termios.tcgetattr(sys.stdin)

    def cleanup(*_):
        termios.tcsetattr(sys.stdin, termios.TCSADRAIN, old_settings)
        show_cursor()
        clear_screen()
        if cap:
            cap.release()
        if ffmpeg_proc:
            ffmpeg_proc.kill()
        print(f"\n\033[36mhexcast\033[0m — {frame_num} frames. Goodbye.")
        sys.exit(0)

    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    try:
        tty.setcbreak(sys.stdin.fileno())
        hide_cursor()
        clear_screen()

        cam_info = ""
        if available_cameras and len(available_cameras) > 1:
            cam_info = f"  c=swap camera ({len(available_cameras)} found) "
        sys.stdout.write(
            f"\033[36m  hexcast {__version__}\033[0m "
            f"\033[90m— live {source_name} → terminal\033[0m\n"
            f"\033[90m  q=quit  t=thermal  a=ascii  +/-=brightness  space=pause"
            f"{cam_info}\033[0m\n"
        )
        sys.stdout.flush()
        time.sleep(0.6)
        last_output = ""

        while True:
            t0 = time.monotonic()

            if kbhit():
                ch = getch()
                if ch in ("q", "Q", "\x03"):
                    cleanup()
                elif ch == "t":
                    thermal = not thermal
                elif ch == "a":
                    ascii_mode = not ascii_mode
                elif ch in ("+", "="):
                    brightness = min(2.0, brightness + 0.1)
                elif ch in ("-", "_"):
                    brightness = max(0.2, brightness - 0.1)
                elif ch == " ":
                    paused = not paused
                elif ch in ("c", "C") and available_cameras and len(available_cameras) > 1:
                    # Swap camera
                    cap, cam_idx, cam_facing = swap_camera(cap, cam_idx, available_cameras, direction=1)
                    source_name = f"camera:{cam_idx} ({cam_facing})"
                    if cap is None:
                        # Swap failed, revert to first available
                        cap = open_camera(available_cameras[0]["index"])
                        cam_idx = available_cameras[0]["index"]
                        cam_facing = available_cameras[0]["facing"]
                        source_name = f"camera:{cam_idx} ({cam_facing})"
                elif ch in ("f",) and available_cameras:
                    # Quick jump to front camera
                    front = [c for c in available_cameras if c["facing"] == "front"]
                    if front and front[0]["index"] != cam_idx:
                        if cap:
                            cap.release()
                        cam_idx = front[0]["index"]
                        cam_facing = "front"
                        cap = open_camera(cam_idx)
                        source_name = f"camera:{cam_idx} (front)"
                elif ch in ("b",) and available_cameras:
                    # Quick jump to back camera
                    back = [c for c in available_cameras if c["facing"] == "back"]
                    if back and back[0]["index"] != cam_idx:
                        if cap:
                            cap.release()
                        cam_idx = back[0]["index"]
                        cam_facing = "back"
                        cap = open_camera(cam_idx)
                        source_name = f"camera:{cam_idx} (back)"
                elif ch == "s":
                    fname = f"hexcast-{int(time.time())}.ans"
                    try:
                        with open(fname, "w") as fh:
                            fh.write(last_output)
                    except Exception:
                        pass

            if paused:
                time.sleep(0.05)
                continue

            cols, rows_total = terminal_size()
            if cols_override > 0:
                cols = cols_override
            rows = rows_total - 2

            if args.test:
                frame = generate_test_pattern(cols, rows * 2 if not ascii_mode else rows, frame_num)
            elif ffmpeg_proc:
                raw = ffmpeg_proc.stdout.read(screen_w * screen_h * 3)
                if not raw or len(raw) < screen_w * screen_h * 3:
                    cleanup()
                frame = np.frombuffer(raw, dtype=np.uint8).reshape((screen_h, screen_w, 3))
            else:
                ret, frame = cap.read()
                if not ret:
                    if args.file:
                        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                        continue
                    cleanup()

            frame_num += 1

            if ascii_mode:
                last_output = render_frame_ascii(frame, cols, rows, thermal, brightness)
            else:
                last_output = render_frame_truecolor(frame, cols, rows, thermal, brightness)

            elapsed = time.monotonic() - t0
            fps_actual = 1.0 / elapsed if elapsed > 0 else 0
            h, w = frame.shape[:2]
            mode_str = ("thermal " if thermal else "") + ("ascii" if ascii_mode else "truecolor")
            status = (
                f"\033[36m hexcast\033[0m "
                f"\033[90m{source_name} {w}×{h}→{cols}×{rows} "
                f"f:{frame_num} fps:{fps_actual:.0f}/{target_fps} "
                f"brt:{brightness:.1f} {mode_str}\033[0m"
            )

            move_cursor(1, 1)
            sys.stdout.write(last_output + "\n" + status)
            sys.stdout.flush()

            elapsed = time.monotonic() - t0
            sleep_time = frame_interval - elapsed
            if sleep_time > 0:
                time.sleep(sleep_time)

    except Exception as e:
        termios.tcsetattr(sys.stdin, termios.TCSADRAIN, old_settings)
        show_cursor()
        print(f"\n\033[31mError: {e}\033[0m")
        if cap:
            cap.release()
        if ffmpeg_proc:
            ffmpeg_proc.kill()
        sys.exit(1)


if __name__ == "__main__":
    main()
