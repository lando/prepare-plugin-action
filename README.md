# Prepare Release Action

This action allows you to automate release steps eg bump version, compile code, bundle deps and optionally push/sync those changes back to the soruce repo.

It was designed for Lando Plugin and has an easy-mode `lando-plugin` input, however, you should be able to use it on any javascript project.

## Inputs

All inputs are optional however if you are **NOT** triggering this action on a `release` then you will need to set `version`.

| Name | Description | Default | Example |
|---|---|---|---|
| `version` | The version of the thing to be released. Must be a semver valid string. | `${{ github.event.release.tag_name }}` | `v3.14.0` |
| `commands` | A list of commands to run to prepare the release. | `[]` | `npm run prepare` |
| `lando-plugin` | A special easy-mode setting to prepare and valdiate Lando plugins. | `false` | `true` |
| `root` | The location of the code being prepared for release. | `${{ github.workspace }}` | `/path/to/my/project` |
| `sync` | A toggle to enable/disable code syncing. | `true` | `false` |
| `sync-branch` | The target branch to use when syncing changes back to the repo. | `${{ github.event.release.target_commitish \|\| github.event.pull_request.head.ref \|\| github.ref_name }}` | `main` |
| `sync-email` | The email to use when syncing changes back to the repo. | `github-actions@github.com` | `riker@starfleet.gov` |
| `sync-message` | The commit message to use when syncing changes back to the repo. | `release %s generated by @lando/prepare-release-action` | `RELEASE %s` |
| `sync-tags` | A list of other tags to sync back to the repo. | `[]` | `v2` |
| `sync-username` | The username to use when syncing changes back to the repo. | `github-actions` | `w.t.riker` |

Note that `sync` must be set to `true` for the other `sync-*` options to do anything. Also note that in `sync-message` you can use `%s` as a placeholder for the version.

## Notes

We do expand the initial shallow clone that's the default for `actions/checkout` to a full clone in order to re-commit the "bumped" version of your plugin.

##  Usage

### Basic Usage

```yaml
- name: Prepare Release
  uses: lando/prepare-release-action@v2
```

### Advanced Usage

**Lando Plugin examples:**

```yaml
- name: Prepare Release
  uses: lando/prepare-release-action@v2
    lando-plugin: true
```

**GitHub Action javascript action example:**

```yaml
- name: Prepare Release
  uses: lando/prepare-release-action@v2
    commands: |
      npm run prepare
    sync-tags: v2
```

**Everything, everywhere, all at once:**

```yaml
- name: Prepare Release
  uses: lando/prepare-release-action@v2
    version: v3.1.4-riker.1
    commands: |
      touch riker
      npm run prepare
    lando-plugin: false
    sync: true
    sync-branch: kirk-epsilon
    sync-email: riker@hotmale.com
    sync-message: "Execute evasive manuveur pattern Riker %s"
    sync-tags: |
      v1
      riker1
      number2
    sync-username: w.t.riker
```

## Changelog

We try to log all changes big and small in both [THE CHANGELOG](https://github.com/lando/prepare-release-action/blob/main/CHANGELOG.md) and the [release notes](https://github.com/lando/prepare-release-action/releases).

## Releasing

Create a release and publish to [GitHub Actions Marketplace](https://docs.github.com/en/enterprise-cloud@latest/actions/creating-actions/publishing-actions-in-github-marketplace)

## Contributors

<a href="https://github.com/lando/prepare-release-action/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=lando/prepare-release-action" />
</a>

Made with [contrib.rocks](https://contrib.rocks).

## Other Resources

* [Important advice](https://www.youtube.com/watch?v=WA4iX5D9Z64)
