'use babel';

import SelectListView from 'atom-select-list';
import fuzzaldrin from 'fuzzaldrin';
import request from 'request'

export default class LeetcodeSearchView {
    constructor(leetcodeResultView) {
        console.log('in constructor of search view');

        this.leetcodeResultView = leetcodeResultView;
        this.questionList = [];
        this.selectListView = new SelectListView({
            items: this.questionList,
            emptyMessage: 'No matches found',
            filterKeyForItem: (item) => item.displayName,
            elementForItem: ({
                displayName
            }) => {
                const li = document.createElement('li');
                const div = document.createElement('div');

                li.appendChild(div);

                const span = document.createElement('span');

                const query = this.selectListView.getQuery();
                const matches = fuzzaldrin.match(displayName, query);
                let matchedChars = [];
                let lastIndex = 0;
                for (const matchIndex of matches) {
                    const unmatched = displayName.substring(lastIndex, matchIndex);
                    if (unmatched) {
                        if (matchedChars.length > 0) {
                            const matchSpan = document.createElement('span');
                            matchSpan.textContent = matchedChars.join('');
                            span.appendChild(matchSpan);
                            matchedChars = [];
                        }

                        span.appendChild(document.createTextNode(unmatched));
                    }

                    matchedChars.push(displayName[matchIndex]);
                    lastIndex = matchIndex + 1;
                }

                if (matchedChars.length > 0) {
                    const matchSpan = document.createElement('span');
                    matchSpan.textContent = matchedChars.join('');
                    span.appendChild(matchSpan);
                }

                const unmatched = displayName.substring(lastIndex);
                if (unmatched) {
                    span.appendChild(document.createTextNode(unmatched));
                }

                li.appendChild(span);
                return li;
            },
            didConfirmSelection: (question) => {
                this.hide();
                questionId = question.displayName.match(/[^:]*/)[0];
                question = question.displayName.match(/\s([\w\s]+) \(/)[1];
                folderName = this.getFolderNameInGit(questionId, question);
                // this.leetcodeResultView.getProblem(null, question);
                this.populateProblemOnEditor(folderName);
            },
            didCancelSelection: () => {
                this.hide();
            }
        });
    }

    getFolderNameInGit(questionId, question) {
        return questionId + '_' + question.replace(/\s/g, '');
    }

    populateProblemOnEditor(folderName) {
        let url = atom.config.get("Qeetcode.githubURL")
        url += folderName + '/question.txt';

        var options = {
            'url': url,
            'auth': {
                'user': atom.config.get("Qeetcode.accessToken"),
                'pass': 'x-oauth-basic'
            }
        };

        let editor
        let self = this
        if (editor = atom.workspace.getActiveTextEditor()) {
            request(options, (error, response, body) => {
                if (!error && response.statusCode == 200) {
                    editor.insertText(body);
                    console.log(body)
                } else {
                    console.log("Error occured");
                    console.log(response.statusCode);
                }
            })
        }
    }

    async destroy() {
        await this.selectListView.destroy();
    }

    toggle() {
        console.log('in toggle');
        if (this.panel && this.panel.isVisible()) {
            console.log('2');
            this.hide();
            return Promise.resolve();
        } else {
            console.log('1');
            return this.show();
        }
    }

    async show() {
        if (!this.panel) {
            this.panel = atom.workspace.addModalPanel({
                item: this.selectListView
            });
        }

        this.selectListView.refs.queryEditor.selectAll();

        await this.leetcodeResultView.getQuestionList().then((questionList) => {
            this.questionList = questionList.map((e, i) => {
                return {
                    displayName: `${e.id}: ${e.title} (${e.difficulty})`
                };
            });
        });

        this.questionList.sort((a, b) => a.displayName.localeCompare(b.displayName));
        await this.selectListView.update({
            items: this.questionList
        });

        this.previouslyFocusedElement = document.activeElement;
        this.panel.show();
        this.selectListView.focus();
    }

    hide() {
        this.panel.hide();
        if (this.previouslyFocusedElement) {
            this.previouslyFocusedElement.focus();
            this.previouslyFocusedElement = null;
        }
    }

}
