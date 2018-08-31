'use babel';

import QeetcodeView from './qeetcode-view';
import { CompositeDisposable } from 'atom';
import request from 'request'

export default {

  qeetcodeView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.qeetcodeView = new QeetcodeView(state.qeetcodeViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.qeetcodeView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'qeetcode:fetch': () => this.fetch()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.qeetcodeView.destroy();
  },

  serialize() {
    return {
      qeetcodeViewState: this.qeetcodeView.serialize()
    };
  },

  fetch() {
    let editor
    let self = this
    if (editor = atom.workspace.getActiveTextEditor()) {
        request('https://raw.githubusercontent.com/RuiqingQiu/Leetcode/master/leetcode-algorithms/10_RegularExpressionMatching/10_isMatch.py', (error, response, body) => {
            if (!error && response.statusCode == 200) {
                editor.insertText(body);
                console.log(body)
            }
        })
    }
  }

};
