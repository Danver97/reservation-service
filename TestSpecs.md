# Test Specifications

The following piramid will be implemented for each microservice:
1. Integration tests
2. Contract tests
3. Unit tests

## Unit tests

Unit test will be responsible of testing each single microservice modules and interactions between them.
Every external dependencies, like dbs or external components, must be mocked or be in memory.

## Contract tests

Contract test will be responsible of testing inter-service interactions and interaction between differently deployed components of the same microservice.
Every external dependencies, like dbs, must be mocked or be in memory.

## Integration tests

Integration test will be responsible of testing the whole service with any external dependency, and with any differently deployed component belonging to the same microservice.

## How it affects CI

| Test type | When to run |
| --- | --- |
| Unit | At every push, commit, whenever and at soon it's possibile |
| Contract | At every push OR at every pull request push |
| Integration | At every pull request push: it must validate that the branch is completely working so that the merge to the master is a deployable release |
