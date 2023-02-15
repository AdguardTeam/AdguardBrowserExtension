import { ESLint } from 'eslint'

// A separate config for lint-staged is needed to ignore eslint warnings when
// files from the eslint-config "ignorePatterns" have been ignored.
// See https://github.com/okonet/lint-staged#how-can-i-ignore-files-from-eslintignore
const removeIgnoredFiles = async (files) => {
  const eslint = new ESLint()
  const isIgnored = await Promise.all(
    files.map((file) => {
      return eslint.isPathIgnored(file)
    })
  )
  // Array.prototype.filter does not support asynchronous function for checking.
  // So we save the results of the check to an index and retrieve the value from
  // there.
  const filteredFiles = files.filter((_, i) => !isIgnored[i])
  return filteredFiles.join(' ')
}

// Note that this configuration will add a "lint-staged" section to package.json
// at checking and remove that section when the check is complete. This is
// strange behavior, especially if you terminate the check in the middle. Then
// the "lint-staged" section will remain in package.json and you should remove
// it from the diff before committing.
export default {
  '*.{ts,tsx,js,jsx}': async (files) => {
    const filesToLint = await removeIgnoredFiles(files)
    return [`eslint --cache --max-warnings=0 ${filesToLint}`]
  },
}
