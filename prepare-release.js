'use strict';

const core = require('@actions/core');
const exec = require('@actions/exec');
const fs = require('fs');
const getInputs = require('./lib/get-inputs');
const isLandoPlugin = require('./lib/is-lando-plugin');
const io = require('@actions/io');
const jsonfile = require('jsonfile');
const path = require('path');
const semverClean = require('semver/functions/clean');
const semverValid = require('semver/functions/valid');

const {execSync} = require('child_process');

const main = async () => {
  // start by getting the inputs
  const inputs = getInputs();
  // add more
  inputs.pjson = path.join(inputs.root, 'package.json');

  try {
    // validate that we have a version
    if (!inputs.version) throw new Error('Version is a required input!');
    // and that it is semantically valid
    if (semverValid(semverClean(inputs.version)) === null) throw new Error('Version must be semver valid!');
    // and that we have a package.json
    if (!fs.existsSync(inputs.pjson)) throw new Error(`Could not detect a package.json in ${inputs.root}`);

    // add global utils, we do this regardless so we can invoke directly and control the version
    core.startGroup('Ensuring utils');
    await exec.exec('npm', ['install', '--global', 'bundle-dependencies@1.0.2']);
    await exec.exec('npm', ['install', '--global', 'version-bump-prompt@6.1.0']);
    const binDir = execSync('npm config get prefix', {maxBuffer: 1024 * 1024 * 10, encoding: 'utf-8'});
    core.info(`bin-dir: ${binDir.trim()}`);
    await exec.exec('ls', ['-lsa', binDir.trim()]);
    core.endGroup();

    // configure git
    core.startGroup('Configuring git');
    // get status of shallowness
    const isShallow = execSync('git rev-parse --is-shallow-repository', {maxBuffer: 1024 * 1024 * 10, encoding: 'utf-8'});
    // set user/email
    await exec.exec('git', ['config', 'user.name', inputs.syncUsername]);
    await exec.exec('git', ['config', 'user.email', inputs.syncEmail]);
    // if a shallow repo then unshallow and fetch all
    if (isShallow.trim() === 'true') {
      await exec.exec('git', ['fetch', '--unshallow']);
      await exec.exec('git', ['fetch', '--all']);
    }
    // check out correct branch
    await exec.exec('git', ['checkout', inputs.syncBranch]);
    core.endGroup();

    // if using landoPlugin ez-mode then also bundle deps
    if (inputs.landoPlugin) {
      await exec.exec(`${binDir}/bundle-dependencies`, ['update']);
      await exec.exec(`${binDir}/bundle-dependencies`, ['list-bundled-dependencies']);
    }

    // run user specified commands
    for (const command of inputs.commands) await exec.exec(command);

    // bump version
    await exec.exec(`${binDir}/bump`, [inputs.version, '--commit', inputs.syncMessage, '--all']);

    // get helpful stuff
    const currentCommit = execSync('git log --pretty=format:\'%h\' -n 1', {maxBuffer: 1024 * 1024 * 10, encoding: 'utf-8'});
    const tags = inputs.syncTags.concat([inputs.version]);

    // tag commits
    for (const tag of tags) await exec.exec('git', ['tag', '--force', tag, currentCommit.trim()]);

    // if using landoPlugin ez-mode then validate lando plugin
    if (inputs.landoPlugin && !isLandoPlugin(jsonfile.readFileSync(inputs.pjson))) {
      throw new Error('Does not appear to be a valid Lando plugin! package.json must contain a lando key or the lando-plugin keyword');
    }

    // log where we are at before we sync
    core.startGroup('Change information');
    await exec.exec('git', ['--no-pager', 'log', '-1']);
    await exec.exec('git', ['--no-pager', 'tag', '--points-at', 'HEAD']);
    await exec.exec('git', ['diff', 'HEAD~1']);
    core.endGroup();

    // sync back to repo if applicable
    if (inputs.sync) {
      await exec.exec('git', ['push', 'origin', inputs.syncBranch]);
      for (const tag of tags) await exec.exec('git', ['push', '--force', 'origin', tag]);
    }

  // catch
  } catch (error) {
    core.setFailed(error.message);
    process.exit(1);
  }
};

// main logix
main();
