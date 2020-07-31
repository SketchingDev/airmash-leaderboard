# Website

## GitHub Pages

Since this website is being hosted on GitHub pages there are two considerations:
 * [HashRouting](https://create-react-app.dev/docs/deployment/#notes-on-client-side-routing) or [404 redirection](https://github.com/rafgraph/spa-github-pages).
   I've opted for the former as it's simpler.
 * [Configuring CircleCI with a deploy key with write access](https://circleci.com/docs/2.0/gh-bb-integration/#deployment-keys-and-user-keys)
   so the `gh-pages` module can push the build app back to the repository - the default deploy key is read-only.

