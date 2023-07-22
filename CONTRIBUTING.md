# Contributing Guidelines

Thank you for your interest in contributing to our project. Whether it's a bug report, new feature, correction, or additional
documentation, we greatly value feedback and contributions from our community.

Please read through this document before submitting any issues or pull requests to ensure we have all the necessary
information to effectively respond to your bug report or contribution.


## Reporting Bugs/Feature Requests

We welcome you to use the GitHub issue tracker to report bugs or suggest features.

When filing an issue, please check existing open, or recently closed, issues to make sure somebody else hasn't already
reported the issue. Please try to include as much information as you can. Details like these are incredibly useful:

* A reproducible test case or series of steps
* The version of our code being used
* Any modifications you've made relevant to the bug
* Anything unusual about your environment or deployment


## Contributing via Pull Requests

This is mostly the same as [GitHub's guide on creating a pull request](https://help.github.com/articles/creating-a-pull-request/).

First, create a _fork_ of `clickstream-web`. Clone it, and make changes to this _fork_.

```shell
git clone git@github.com:your_username/clickstream-web.git 
```

After you have tested your feature/fix, by adding sufficient test coverage, and
validating Checkstyle, lint, and the existing test suites, you're ready to
publish your change.

The commit message should look like below. It started with a prefix like feat/fix or
chore. After a paragraph describing what you've done, include links to useful resources. These might
include design documents, StackOverflow implementation notes, GitHub issues,
etc. All links must be publicly accessible.

```console
feat: add new preset event for screen view.

Resolves: https://github.com/awslabs/clickstream-web/issues/222
See also: https://stackoverflow.com/a/58662077/695787
```

Now, save your work to a new branch:

```shell
git checkout -b feature_page_view
```

To publish it:

```shell
git push -u origin feature_page_view
```

This last step will give you a URL to view a GitHub page in your browser.
Copy-paste this, and complete the workflow in the UI. It will invite you to
"create a PR" from your newly published branch.

### Pull Request Guidelines
- The title of your PR must be descriptive to the specific change.
- The title of your PR must be of below format since next release version is determined from PR titles in the commit history.
    - For a bugfix: `fix: description of changes`
    - For a feature: `feat: add awesome feature`
    - Everything else: `chore: fix build script`
- No period at the end of the title.
- Pull Request message should indicate which issues are fixed: `fixes #<issue>` or `closes #<issue>`.
- If not obvious (i.e. from unit tests), describe how you verified that your change works.
- If this PR includes breaking changes, they must be listed at the top of the changelog as described above in the Pull Request Checklist.
- PR must be reviewed by at least one repository maintainer, in order
  to be considered for inclusion.
- PR must also pass the Actions like Checkstyle, Lint, and Unit tests.
- Usually all these are going to be **squashed** when you merge to main.
- Make sure to update the PR title/description if things change.
- Rebase with the `main` branch if it has commits ahead of your fork.

Contributions via pull requests are much appreciated. Before sending us a pull request, please ensure that:

1. You are working against the latest source on the *main* branch.
2. You check existing open, and recently merged, pull requests to make sure someone else hasn't addressed the problem already.
3. You open an issue to discuss any significant work - we would hate for your time to be wasted.

To send us a pull request, please:

1. Fork the repository.
2. Modify the source; please focus on the specific change you are contributing. If you also reformat all the code, it will be hard for us to focus on your change.
3. Ensure local tests pass.
4. Commit to your fork using clear commit messages.
5. Send us a pull request, answering any default questions in the pull request interface.
6. Pay attention to any automated CI failures reported in the pull request, and stay involved in the conversation.

GitHub provides additional document on [forking a repository](https://help.github.com/articles/fork-a-repo/) and
[creating a pull request](https://help.github.com/articles/creating-a-pull-request/).


## Finding contributions to work on
Looking at the existing issues is a great way to find something to contribute on. As our projects, by default, use the default GitHub issue labels (enhancement/bug/duplicate/help wanted/invalid/question/wontfix), looking at any 'help wanted' issues is a great place to start.


## Code of Conduct
This project has adopted the [Amazon Open Source Code of Conduct](https://aws.github.io/code-of-conduct).
For more information see the [Code of Conduct FAQ](https://aws.github.io/code-of-conduct-faq) or contact
opensource-codeofconduct@amazon.com with any additional questions or comments.


## Security issue notifications
If you discover a potential security issue in this project we ask that you notify AWS/Amazon Security via our [vulnerability reporting page](http://aws.amazon.com/security/vulnerability-reporting/). Please do **not** create a public github issue.


## Licensing

See the [LICENSE](LICENSE) file for our project's licensing. We will ask you to confirm the licensing of your contribution.
