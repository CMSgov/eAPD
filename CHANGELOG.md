# Next release

Anticipated release: July 9, 2021

#### 🚀 New features

- Allow switching between states/affiliations when applicable ([#2581])
- Update the delete process for FFY ([#2996])
- New design updates to Manage Account page ([#3204])
- updated Assurance and Compliance text on APD review and export screen to show more detailed information. ([#3169]))
- Login screen is disabled if api check fails ([#3223])

#### 🐛 Bugs fixed

- Images don't load unless you refresh page after logging in ([#3180])
- Removes "Federal" as an option for State Medicaid address ([#3181])
- Revoking a user's access is causing them to disappear and not show in the Inactive tab ([#3238])
- Fixed issue with not storing okta data on login ([#3242])

#### ⚙️ Behind the scenes


- install cypress for end-to-end testing ([#3226])

- Created endpoint to allow a user to switch states ([#3030])
- Added security check to state/:id endpoint so only users with access to that state can get the data ([#3129])
- endpoint for pulling a user's affiliations ([#3207])


# Previous releases

See our [release history](https://github.com/CMSgov/eAPD/releases)


[#2581]: https://github.com/CMSgov/eAPD/issues/2581
[#2996]: https://github.com/CMSgov/eAPD/issues/2996
[#3030]: https://github.com/CMSgov/eAPD/issues/3030
[#3242]: https://github.com/CMSgov/eAPD/issues/3242
[#3223]: https://github.com/CMSgov/eAPD/issues/3223
[#3181]: https://github.com/CMSgov/eAPD/issues/3181
[#3204]: https://github.com/CMSgov/eAPD/issues/3204
[#3207]: https://github.com/CMSgov/eAPD/issues/3207
[#3226]: https://github.com/CMSgov/eAPD/issues/3226
[#3180]: https://github.com/CMSgov/eAPD/issues/3180
[#3181]: https://github.com/CMSgov/eAPD/issues/3181
[#3169]: https://github.com/CMSgov/eAPD/issues/3169
[#3238]: https://github.com/CMSgov/eAPD/issues/3238
[#3194]: https://github.com/CMSgov/eAPD/issues/3194
