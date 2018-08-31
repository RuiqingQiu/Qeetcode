'use babel';

import QeetcodeView from './qeetcode-view';
import { CompositeDisposable } from 'atom';
import request from 'request'
import packageConfig from './config-schema.json'
import QeetcodeSearchView from './qeetcode-search-view'
import QeetcodeResultView from './qeetcode-result-view'
import SelectListView from 'atom-select-list';

export default {
    config : packageConfig,
  qeetcodeView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
      // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
      this.subscriptions = new CompositeDisposable();

    this.qeetcodeResultView = new QeetcodeResultView();
    this.qeetcodeSearchView = new QeetcodeSearchView(this.qeetcodeResultView)
    this.qeetcodeView = new QeetcodeView(state.qeetcodeViewState);

    this.modalPanel = atom.workspace.addModalPanel({
        item: this.qeetcodeView.getElement(),
        visible: false
    });


    // let selectListView = new SelectListView({
    //     items: [1, 2, 3],
    //     emptyMessage: 'No recordings found.',
    //     filterKeyForItem: (item) => item,
    //     elementForItem: (item) => {
    //         let element = document.createElement('li');
    //         let html = "<b>" + item + "</b>";
    //
    //         html += "<img src=\"#{item}\">";
    //
    //         element.innerHTML = html;
    //
    //         return element;
    //     },
    //     didConfirmSelection: (question) => {
    //         console.log('confirm');
    //         // this.hide();
    //     },
    //     didCancelSelection: () => {
    //         console.log('cancel');
    //         // this.hide();
    //     }
    // });
    //
    // this.modalPanel = atom.workspace.addModalPanel({
    //     item: selectListView,
    //     visible: false
    // });

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
        'qeetcode:search': () => this.qeetcodeSearchView.toggle(),
        'qeetcode:fetch': () => this.fetch()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.qeetcodeView.destroy();
    this.qeetcodeResultView.destroy();
    this.qeetcodeSearchView.destroy();
  },

  serialize() {
    return {
      qeetcodeViewState: this.qeetcodeView.serialize()
    };
},
  fetch() {
      this.download('https://leetcode.com/api/problems/all/').then((json) => {
        const questionsJSON = JSON.parse(json).stat_status_pairs.filter((e, i) => {
            // if (search) {
            //     difficulty = e.difficulty.level;
            //     return e.stat.question__title.toLowerCase() === search.toLowerCase();
            // } else if (difficulty) {
            //     return (e.difficulty.level === difficulty && !e.paid_only);
            // }
        });
      })
        let questions = this.getQuestionList()
        console.log(questions)
      let url = atom.config.get("Qeetcode.githubURL")
      url += '10_RegularExpressionMatching/10_isMatch.py'
      console.log("url is " + url);

    let editor
    let self = this
    if (editor = atom.workspace.getActiveTextEditor()) {
        request(url, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                editor.insertText(body);
                console.log(body)
            }
        })
    }
},
    getQuestionList() {
        return new Promise((resolve, reject) => {
            this.download('https://leetcode.com/api/problems/all/').then((json) => {
                const questionsJSON = JSON.parse(json).stat_status_pairs.filter((e, i) => {
                    return !e.paid_only;
                });
                let questions = [];
                for (var x in questionsJSON) {
                    questions.push({
                        difficulty: questionsJSON[x].difficulty.level,
                        title: questionsJSON[x].stat.question__title
                    });
                }
                resolve(questions);
            }).catch((err) => {
                reject(err);
            });
        });
    },
    download(url) {
        return new Promise((resolve, reject) => {
            request(url, (error, response, body) => {
                if (!error && response.statusCode == 200) {
                    resolve(body);
                } else {
                    reject({
                        reason: 'Unable to download'
                    });
                }
            });
        });
    }
};
