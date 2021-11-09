/* eslint-env worker */
/* globals LightningFS git MagicPortal GitHttp */
importScripts(
  "https://unpkg.com/browserfs@1.4.3/dist/browserfs.js",
  "https://unpkg.com/@isomorphic-git/lightning-fs",
  "https://unpkg.com/isomorphic-git@beta",
  "https://unpkg.com/isomorphic-git@beta/http/web/index.umd.js",
  "https://unpkg.com/magic-portal"
);

const portal = new MagicPortal(self);
self.addEventListener("message", ({ data }) => console.log(data));

function BrowserFSConfigure() {
  return new Promise(function(resolve, reject) {
      BrowserFS.configure({
          fs: 'IndexedDB',
          options: {}
      }, function (err) {
          if (err) {
              var term = $.terminal.active();
              if (!term) {
                  term = $('.term').terminal(function(command, term) {
                      term.error('BrowserFS was not initialized');
                  }, {greetings: false, name: 'git'}).echo(greetings);
              }
              term.error(err.message || err);
              reject(err.message || err);
          } else {
              resolve();
          }
      });
  });
}

let fs = null;
BrowserFSConfigure().then(()=>{
  fs = BrowserFS.BFSRequire('fs');

  console.log(fs)
  fs.readFile('/fs/package.json', (err, data)=>{
    console.log(data);
  });
});
(async () => {
  let mainThread = await portal.get("mainThread");
  let dir = "/";

  portal.set("workerThread", {
    setDir: async _dir => {
      dir = _dir;
    },
    clone: async args => {
      return git.clone({
        ...args,
        fs,
        http: GitHttp,
        dir,
        onProgress(evt) {
          mainThread.progress(evt);
        },
        onMessage(msg) {
          mainThread.print(msg);
        },
        onAuth(url) {
          console.log(url);
          return mainThread.fill(url);
        },
        onAuthFailure({ url, auth }) {
          return mainThread.rejected({ url, auth });
        }
      });
    }
  });
})();
