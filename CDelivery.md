# Continous Delivery & Git Workflow
This is made to explain how the project is managed

## Git Workflow
3 types of branches:
- `master`
- `feature`
- `release`
- `hotfix`
### Rules
- `master` must always be green:  
  every **Pull Request** must be green (build & tested) before being merged
- `feature` branch checks out from `master` and will merge into it
- `hotfix` branch checks out from a `master` release (tag) and will merge into it
- once a `hotfix` branch is ready to be merged, a tag for the patch release is added as last commit of the `hotfix` branch and then it is merged.
- `release` branch checks out from `master`, it's made for breaking changes (*major releases*) and will merge back on `master`
- every merge into `master` must be done through a **Pull Request**

## Continous Delivery
### Rules
- Releases are made on `master` automatically by the build server (*Travis* in this case).  
  Once a `feature` branch is merged, a build is triggered which will tag the merge commit (making a GitHub release).
- User Acceptance Tests are done in production by end-users.
- Incremental semantic version numbers are computed on `master` branch.
