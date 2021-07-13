[![Build status](https://img.shields.io/circleci/project/github/CMSgov/eAPD.svg)](https://circleci.com/gh/CMSgov/workflows/eAPD)
[![Test coverage](https://img.shields.io/codecov/c/github/CMSgov/eAPD.svg)](https://codecov.io/gh/CMSgov/eAPD)
![Node.js >= 14.16](https://img.shields.io/badge/node-%3E%3D%2014.16-brightgreen.svg)

# CMS eAPD app 

This project aims to create a user-friendly, modern product to streamline the
creation, submission, review, and approval of Medicaid APDs and their
associated contract documents. It is currently limited to HITECH but may
potentially be expanded to other Medicaid programs in the future.

_Please note:_ Any content contained in screenshots from the application within
the `eAPD` repo should be considered test data being used for
development purposes ONLY. Project, financial, and timeline information is NOT
representative of any production data from actual users.

## Developing

### Getting the code

First you'll need to get the code onto your computer. The easiest way is to
clone it with git. If you're not familiar with git, a tool like
[Github Desktop](https://desktop.github.com/) or
[SourceTree](https://www.sourcetreeapp.com/) can help make the experience
easier.

Most people will use the HTTPS link, but if you're a project contributor and
you have your SSH keys configured, you'll clone from the SSH link. You can
find the link by clicking the green "Clone or download" button above the file
listing on this page.

The HTTPS link is https://github.com/CMSgov/eAPD.git

If you're familiar with git and just want to work from the command line, you
just need to run:

```shell
git clone https://github.com/CMSgov/eAPD.git
```

If you can't use git for some reason, you can also download the most recent
code as [a ZIP file](https://github.com/CMSgov/eAPD/archive/master.zip).

### Setting up environment variables

The app uses Okta for authentication. If you do not have an Okta application already
set up, you can create an Okta account and Okta application following these
[instructions](https://developer.okta.com/docs/guides/sign-into-spa/react/before-you-begin/).
Set the following environment variables:

```shell
export OKTA_DOMAIN= #from admin, or Applications -> (your application) -> General
export OKTA_SERVER_ID= #from admin, API -> Authorization Server, and the value under Name
export OKTA_CLIENT_ID= #from admin, or Applications -> (your application) -> General
export OKTA_API_KEY= #from admin, API -> Tokens -> Create Token, and the Token Value
```
In addition, the app will issue a JWT for internal authentication.  This requires a separate secret.
You will need to create one and export it to your environment using:

```shell
export JWT_SECRET= #Your secret.  Should be at lest 32 truly random characters (letter and numbers) in production.
```


### Create Okta accounts

Create accounts in your Okta application with the following User Names (these accounts will
be used for testing, so they cannot require MFA):

```shell
  em@il.com
  reviewer
  fedadmin
  stateadmin
  statestaff
  statecontractor
```

Make sure you record the passwords that you set them to. You can use fake emails or if you
have a gmail account, you can add `+reviewer` to your email username (e.g. me+reviewer@gmail.com) to have them all email to your email.

### Making it run

We recommend using [Docker](https://www.docker.com) to run the app locally. We
provide a Docker configuration that will quickly install and build everything
you need, so don't have to. It'll also take care of getting everything running
and connected. For more details,
[see our wiki](https://github.com/CMSgov/eAPD/wiki/Development-Environment#docker).
If you don't have or can't use Docker, you can also run everything
[manually](https://github.com/CMSgov/eAPD/wiki/Development-Environment#manually).

From your command line, switch to the directory where you put the code and
then run `docker-compose up`. This step could take a few minutes. Once it's
finished, you can populate the database. While the docker process is still
running, open a new terminal window or tab and run:

```shell
docker-compose exec api npm run migrate
docker-compose exec api npm run seed
```

You should now be able to open the app at
[http://localhost:8080](http://localhost:8080). You can login with any of
the accounts that you made above. The `em@il.com` account has the role of state admin.
The rest have roles that match their usernames. This is handled in the seed
and does not need to be set in Okta.

See the
[testing documentation](https://github.com/CMSgov/eAPD/wiki/Development-accessibility%2C-testing%2C-and-linting#testing)
for information about running tests.

### More technical documentation

Check out the
[developer documentation](https://github.com/CMSgov/eAPD/wiki/Development-index)
for a deeper dive into how the app works.

## Contributing

We would be happy to receive pull requests to fix bugs or make improvements,
though we can't make any promises about having time to review or accept them.
Pull requests should be made into the `master` branch. Be sure to check out
our [contributing](CONTRIBUTING.md) guide for info about our policies.

## Public domain

This project is in the worldwide [public domain](LICENSE.md). As stated in
[CONTRIBUTING](CONTRIBUTING.md):

> This project is in the public domain within the United States. Copyright
> and related rights in the work worldwide are waived through the
> [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).
>
> All contributions to this project will be released under the CC0 dedication.
> By submitting a pull request, you are agreeing to comply with this waiver of
> copyright interest.
