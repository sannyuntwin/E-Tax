# Performance Testing Setup

## Load Testing Configuration

### Tools Required
- **Apache Bench (ab)**: For basic HTTP load testing
- **Hey**: Modern HTTP load testing tool
- **K6**: Advanced load testing with scripting
- **Artillery**: Enterprise-grade load testing

### Test Scenarios

#### 1. Basic Load Test
```bash
# Test with 100 concurrent users for 30 seconds
ab -n 1000 -c 100 http://localhost:8080/api/health

# Modern alternative with hey
hey -n 1000 -c 100 http://localhost:8080/api/health
```

#### 2. API Endpoint Load Testing
```bash
# Test invoice creation endpoint
hey -m POST -H "Content-Type: application/json" \
  -d '{"invoice_no":"TEST-001","company_id":1,"customer_id":1}' \
  -n 500 -c 50 \
  http://localhost:8080/api/invoices
```

#### 3. K6 Load Test Script
```javascript
// k6-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 50 }, // Ramp up to 50 users
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'], // Error rate under 10%
  },
};

export default function () {
  // Test health endpoint
  let response = http.get('http://localhost:8080/health');
  check(response, {
    'health endpoint status': (r) => r.status === 200,
    'health endpoint time': (r) => r.timings.duration < 200,
  });

  // Test invoice list endpoint
  response = http.get('http://localhost:8080/api/invoices', {
    headers: { 'Authorization': 'Bearer YOUR_TEST_TOKEN' }
  });
  check(response, {
    'invoices endpoint status': (r) => r.status === 200,
    'invoices endpoint time': (r) => r.timings.duration < 1000,
  });

  sleep(1);
}
```

#### 4. Artillery Configuration
```yaml
# artillery-config.yml
config:
  target: 'http://localhost:8080'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 100

scenarios:
  - name: "Health Check"
    weight: 40
    flow:
      - get:
          url: "/health"

  - name: "API Authentication"
    weight: 30
    flow:
      - post:
          url: "/api/auth/login"
          json:
            username: "testuser"
            password: "testpass"

  - name: "Invoice Operations"
    weight: 30
    flow:
      - get:
          url: "/api/invoices"
          headers:
            Authorization: "Bearer {{ token }}"
```

### Performance Monitoring

#### 1. Application Metrics
- Response times (p50, p95, p99)
- Throughput (requests per second)
- Error rates
- Memory usage
- CPU usage
- Database connection pool usage

#### 2. System Metrics
- Server resource utilization
- Network I/O
- Disk I/O
- Database performance

### Test Execution

#### Prerequisites
1. **Start Application**: Ensure E-Tax system is running
2. **Database Setup**: Use test database with realistic data
3. **Environment**: Use production-like configuration
4. **Monitoring**: Enable all performance monitoring

#### Running Tests
```bash
# Basic load test
ab -n 1000 -c 100 http://localhost:8080/api/health

# K6 test
k6 run k6-load-test.js

# Artillery test
artillery run artillery-config.yml

# Monitor during tests
# Check application logs
# Monitor system resources
# Track database performance
```

### Performance Benchmarks

#### Target Metrics
- **Response Time**: p95 < 500ms for API endpoints
- **Throughput**: > 100 requests/second for simple endpoints
- **Error Rate**: < 1% for all endpoints
- **Resource Usage**: CPU < 80%, Memory < 80%
- **Database**: Connection pool usage < 80%

#### Acceptable Limits
- **Response Time**: p95 < 1000ms for complex operations
- **Throughput**: > 50 requests/second for complex endpoints
- **Error Rate**: < 5% for all endpoints
- **Resource Usage**: CPU < 90%, Memory < 90%

### Performance Optimization Recommendations

#### 1. Database Optimization
- Implement connection pooling
- Add database indexes
- Optimize query performance
- Consider read replicas

#### 2. Application Optimization
- Implement caching (Redis)
- Optimize JSON serialization
- Add response compression
- Implement async processing

#### 3. Infrastructure Optimization
- Load balancer configuration
- CDN implementation
- Server scaling strategies
- Network optimization

### Continuous Performance Testing

#### Integration with CI/CD
```yaml
# .github/workflows/performance.yml
name: Performance Tests
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  performance-test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Setup K6
      run: |
        sudo gpg -k /usr/share/keyrings/k6-archive.gpg --import <(curl -s https://dl.k6.io/key.gpg)
        sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive.gpg --export > /usr/share/keyrings/k6-archive.keyring
        echo "deb [signed-by=/usr/share/keyrings/k6-archive.keyring] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
        sudo apt-get update
        sudo apt-get install k6
    
    - name: Run Performance Tests
      run: |
        k6 run performance/k6-load-test.js
    
    - name: Upload Results
      uses: actions/upload-artifact@v3
      with:
        name: performance-results
        path: performance-results/
```

### Reporting

#### Performance Reports
- Response time distributions
- Error rate analysis
- Throughput metrics
- Resource utilization graphs
- Bottleneck identification

#### Alerting
- Performance degradation alerts
- Error rate threshold alerts
- Resource usage alerts
- Automated report generation

### Load Testing Best Practices

1. **Gradual Ramp-up**: Start with low load, gradually increase
2. **Realistic Scenarios**: Test actual user behavior patterns
3. **Sustained Testing**: Test extended periods, not just bursts
4. **Monitoring**: Monitor all system components during tests
5. **Isolation**: Use dedicated test environment
6. **Data Cleanup**: Clean up test data after each run
7. **Documentation**: Document all test scenarios and results

### Production Readiness Checklist

- [ ] Load testing completed for all critical endpoints
- [ ] Performance benchmarks met
- [ ] Monitoring and alerting configured
- [ ] Scalability tested
- [ ] Failover testing completed
- [ ] Performance regression tests in CI/CD
- [ ] Production performance baseline established
- [ ] Performance optimization recommendations implemented
