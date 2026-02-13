use criterion::{black_box, criterion_group, criterion_main, Criterion};
use uvspeed_prefix_engine::PrefixClassifier;

const SAMPLE_CODE: &str = r#"
import os
from pathlib import Path

# Configuration
MAX_RETRIES = 3

class DataProcessor:
    def __init__(self, path):
        self.path = Path(path)
        self.data = None

    def load(self):
        with open(self.path) as f:
            self.data = f.read()
        return self

    def process(self):
        if self.data is None:
            raise ValueError("No data loaded")
        
        results = []
        for line in self.data.split('\n'):
            if line.strip():
                results.append(line.upper())
        
        return results

    def save(self, output_path):
        with open(output_path, 'w') as f:
            for result in self.process():
                f.write(result + '\n')
        print(f"Saved to {output_path}")

def main():
    processor = DataProcessor("input.txt")
    processor.load()
    processor.save("output.txt")
    return 0

if __name__ == "__main__":
    main()
"#;

fn bench_classify_single(c: &mut Criterion) {
    let classifier = PrefixClassifier::new();
    c.bench_function("classify_single_line", |b| {
        b.iter(|| classifier.classify(black_box("def process(self, data):")));
    });
}

fn bench_classify_batch(c: &mut Criterion) {
    let classifier = PrefixClassifier::new();
    c.bench_function("classify_batch_42_lines", |b| {
        b.iter(|| classifier.classify_batch(black_box(SAMPLE_CODE)));
    });
}

fn bench_classify_binary(c: &mut Criterion) {
    let classifier = PrefixClassifier::new();
    c.bench_function("classify_binary_pack", |b| {
        b.iter(|| classifier.classify_binary(black_box(SAMPLE_CODE)));
    });
}

fn bench_gutter(c: &mut Criterion) {
    let classifier = PrefixClassifier::new();
    c.bench_function("gutter_42_lines", |b| {
        b.iter(|| classifier.gutter(black_box(SAMPLE_CODE)));
    });
}

criterion_group!(benches, bench_classify_single, bench_classify_batch, bench_classify_binary, bench_gutter);
criterion_main!(benches);
