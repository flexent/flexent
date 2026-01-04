# @luminable/metrics

Idiomatic API for collecting application metrics.

## Usage

### Metrics collection

1. Use counters, gauges and histograms to collect metrics in your application.

    ```ts
    export class MyService {

        @metric()
        importantEvents = new CounterMetric('my_service_important_events_total', 'Total number of times something important happened.');

        doSomething() {
            // ...
            importantEvents.incr();
        }

    }
    ```

### Generating Prometheus report

Generate a Prometheus report from all metrics defined in your mesh:

```ts
const report = generateMetricsReport(mesh);
// Serve as text/plain
```
