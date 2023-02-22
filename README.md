# Label requires reviews action [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=travelperk_label-requires-reviews-action&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=travelperk_label-requires-reviews-action) [![build](https://github.com/travelperk/label-requires-reviews-action/actions/workflows/build.yml/badge.svg?branch=master)](https://github.com/travelperk/label-requires-reviews-action/actions/workflows/build.yml) 
This is a Github Action to modify the required minimum number of approving reviews on a Pull Request depending on the set of labels applied to it.

## Usage

### Create workflow
Create a workflow (eg: `.github/workflows/label-reviews.yml` see [Creating a Workflow file](https://help.github.com/en/articles/configuring-a-workflow#creating-a-workflow-file)) to utilize this action with content:

```yml
# This workflow will set a number or reviewers depending on the labels
name: Label Reviews
# Trigger the workflow on pull requests
on:
  pull_request:
    types:
      - opened
      - reopened
      - synchronize
      - labeled
      - unlabeled
  pull_request_review:
    types:
      - submitted
      - edited
      - dismissed
jobs:
  require-reviewers:
    runs-on: ubuntu-latest
    steps:
      - name: Require-reviewers
        uses: travelperk/label-requires-reviews-action@v1.3.0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          rules_yaml: | # define which PR labels require how many aprroving reviewers
            typescript: 2
            migration: 5
```

`rules_yaml` is a (yaml-formatted multi-line) string of pairs `label`: `# of approving reviewers`. With the example configuration above, this check will fail on a Pull Request that has the `typescript` label until two or more reviewers have approved it. If instead the Pull Request has the `migration` label it will require five, in case both labels are present it will also require five.

`rules_yaml` also supports an array of objects format, as well as being defined in an external file (but then the workflow also needs a checkout step), see documentation of earlier versions https://github.com/travelperk/label-requires-reviews-action/tree/1.3.0#readme.
### Enforce the requirement
To make this check mandatory you need to specify it on the `Branch protection rule` section of the repository settings like the example:

![Marking the action as required](https://user-images.githubusercontent.com/1571416/86369067-3d62ae80-bc7e-11ea-9b40-7c518e6c8a80.png)

According to this configuration, the `master` branch is protected by the option `Required approving reviews` set to `1`. That means that any Pull Request that wants to merge code into master would have to be approved by at least one reviewer.

By checking `Require status checks to pass before merging` and `require-reviewers` anytime the Pull Request gets a new review this action will fire and the Pull Request is labeled with one of the labels that require more than one approving review blocking the possibility of merging until this label required number of approving reviews is reached.

### Saving tip
Since Github Workflow [jobs can have conditionals](https://github.blog/changelog/2019-10-01-github-actions-new-workflow-syntax-features/), and in the workflow you can [directly access some action metadata](https://docs.github.com/en/actions/reference/context-and-expression-syntax-for-github-actions#contexts).

You can avoid checking out the code and running this action if you know the issue does not contain any of the labels that will trigger it, that will set the action as skipped and will never run.

The drawback is that the list of labels will be duplicated, but you can save a lot of actions time.
