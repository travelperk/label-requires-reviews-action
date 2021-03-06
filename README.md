# Label requires reviews action [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=travelperk_label-requires-reviews-action&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=travelperk_label-requires-reviews-action) ![build](https://github.com/travelperk/label-requires-reviews-action/workflows/build/badge.svg)
This is a Github Action to modify the required minimum number of approving reviews on a Pull Request depending on the set of labels applied to it.

## Usage

### Create `.github/label-requires-reviews.yml`

Create a `.github/label-requires-reviews.yml` file containing the pairs of `label` and `reviews`. `lablel` is the name of the label that will be checked on the Pull Request and `reviews` the number of approved reviews needed on the Pull Request for the action to return a success value. In case of having several matching tags the highest number will apply.

Here is an example:

```yml
- label: "typescript"
  reviews: 2
- label: "migration"
  reviews: 5
```

With that configuration this check will fail on a Pull Request that has the `typescript` tag until two or more approving reviews have been added. If instead the Pull Request has the `migration` tag  it will require five, in case both tags are present it will also require five.

### Create workflow
Create a workflow (eg: `.github/workflows/label-reviews.yml` see [Creating a Workflow file](https://help.github.com/en/articles/configuring-a-workflow#creating-a-workflow-file)) to utilize this action with content:

```yml
# This workflow will set a number or reviewers depending on the tags
name: Label Reviews
# Trigger the workflow on pull requests
on:
  pull_request_review:
    types:
      - submitted
      - edited
      - dismissed
jobs:
  require-reviewers:
    runs-on: ubuntu-18.04
    steps:
      - uses: actions/checkout@v2
        with:
          ref: master

      - name: Require-reviewers
        uses: travelperk/label-requires-reviews-action@v0.1
        env:
          GITHUB_TOKEN: ${{ secrets.PERSONAL_ACCESS_TOKEN}}
```

In order for the workflow to be able to perform actions on the Pull Request you'll need to set a `PERSONAL_ACCESS_TOKEN` secret on the repository see [Creating and storing encrypted secrets](https://docs.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets).

### Enforce the requirement
To make this check mandatory you need to specify it on the `Branch protection rule` section of the repository settings like the example:

![Marking the action as required](https://user-images.githubusercontent.com/1571416/86369067-3d62ae80-bc7e-11ea-9b40-7c518e6c8a80.png)

According to this configuration, the `master` branch is protected by the option `Required approving reviews` set to `1`. That means that any Pull Request that wants to merge code into master would have to be approved by at least one reviewer.

By checking `Require status checks to pass before merging` and `require-reviewers` anytime the Pull Request gets a new review this action will fire and the Pull Request is labeled with one of the labels that require more than one approving review blocking the possibility of merging until this label required number of approving reviews is reached.

### Saving tip
Since Github Workflow [jobs can have conditionals](https://github.blog/changelog/2019-10-01-github-actions-new-workflow-syntax-features/), and in the workflow you can [directly access some action metadata](https://docs.github.com/en/actions/reference/context-and-expression-syntax-for-github-actions#contexts).

You can avoid checking out the code and running this action if you know the issue does not contain any of the labels that will trigger it, that will set the action as skipped and will never run.

The drawback is that the list of labels will be duplicated, but you can save a lot of actions time.
