// ==UserScript==
// @name        FF14リッチ編集モードカスタムボタン追加スクリプト
// @namespace   nohohon
// @author      nohohon
// @description FF14のリッチ編集モードでカスタムボタンを追加する
// @include     https://jp.finalfantasyxiv.com/lodestone/my/blog/*
// @include     https://jp.finalfantasyxiv.com/lodestone/my/event/post/*
// @include     http://jp.finalfantasyxiv.com/lodestone/my/blog/*
// @include     http://jp.finalfantasyxiv.com/lodestone/my/event/post/*
// @include     https://jp.finalfantasyxiv.com/lodestone/playguide/db/*
// @version     1.1.0
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// @grant       GM_log
// @grant       GM_registerMenuCommand
// @grant       GM_xmlhttpRequest
// @grant       GM_getResourceText
// @resource    usconfigcss https://cdn.rawgit.com/NohohonNohon/ff14RichEditorCustomBtnScript/master/usconfig.css.template
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// @require     https://cdn.rawgit.com/NohohonNohon/ff14RichEditorCustomBtnScript/master/usconfig.js
// @require     https://cdn.rawgit.com/NohohonNohon/ff14RichEditorCustomBtnScript/master/jquery.selection.js
// ==/UserScript==
(function($) {
    //共通定数

    /** 共通CSSルール */
    var COMMON_CSS = [
        '.wysiwyg_menu__item__custom__size {',
        '	background:url(https://cdn.rawgit.com/NohohonNohon/ff14RichEditorCustomBtnScript/master/img/btn1.png) no-repeat 0 0;',
        '}',
        '.wysiwyg_menu__item__search {',
        '	background:url(https://cdn.rawgit.com/NohohonNohon/ff14RichEditorCustomBtnScript/master/img/btn2.png) no-repeat 0 0;',
        '}',
        '#custom_btn_loading {',
        '  display: table;',
        '  width: 100%;',
        '  height: 100%;',
        '  position: fixed;',
        '  top: 0;',
        '  left: 0;',
        '  background-color: #fff;',
        '  opacity: 0.8;',
        '  z-index: 10009;',
        '}',
        '#custom_btn_loading .custom_btn_loading_msg {',
        '  display: table-cell;',
        '  text-align: center;',
        '  vertical-align: middle;',
        '  padding-top: 140px;',
        '  background: url(https://cdn.rawgit.com/NohohonNohon/ff14RichEditorCustomBtnScript/master/img/gif-load.gif) center center no-repeat;',
        '}'
    ].join('');

    /** エオルゼアデータベース検索画面専用CSSルール */
    var SEARCH_CODE_CSS = [
        '.db-tooltip__bt_item_detail, .db-tooltip__bt_content_detail {',
        '	display: none !important;',
        '}'
    ].join('');

    /** エオルゼアデータベース検索コード返却ポストメッセージ */
    var RETURN_CODE_MSG = 'RETURN_SEARCH_CODE';

    //共通変数

    /** 設定値 */
    var settings = {font_size:'25',tooltip:'カスタム文字サイズ(25)'};

    /** エオルゼアデータベース検索画面のWindowオブジェクト */
    var searchWinObj;

    /** ポストメッセージ送信先 */
    var targetURL;

    //==================================================
    /** カスタムボタン処理 */
    //==================================================
    var CustomBtn = (function() {

        /**
        * CSSルールをページに追加する
        * @param {event} CSSルール
        */
        function addStyleSheet(css) {
            var style = [
                '<style type="text/css">',
                css,
                '</style>'
                ].join('');
            $(style).appendTo('head');
        }

        /**
        * カスタム文字サイズボタン押下時の処理
        * @param {event} イベント
        */
        function clickCustomTextSizeBtn(e) {
            CustomBtn.bb_ins('[size='+settings.font_size+']', '[/size]');
        }

        /**
        * カスタム文字サイズボタンを追加する
        */
        function addCustomTextSizeBtn() {
            //極大サイズボタンの要素を取得
            var elemTextBigSizeBtn = $('.wysiwyg_menu__item--size_big');
            if(elemTextBigSizeBtn[0] != null){
                //カスタム文字サイズボタンのHTMLを定義
                var btnHtml = [
                    '<a id="custom_size_btn" href="javascript:void(0)" class="wysiwyg_menu__item wysiwyg_menu__item__custom__size js__tooltip"',
                    'title="',
                    settings.tooltip,
                    '"></a>'
                ].join('');
                //極大サイズボタンの右に要素を追加
                $(elemTextBigSizeBtn[0]).after(btnHtml);
                //カスタム文字サイズボタンのイベント追加
                $('#custom_size_btn').on('click',clickCustomTextSizeBtn);
            }
        }

        /**
        * エオルゼアデータベース検索ボタン押下時の処理
        * @param {event} イベント
        */
        function clickSearchCodeBtn(e) {
            //ローディング画面を表示
            CustomBtn.dispLoading('検索中...');
            var selectText = $('#input_body').selection();
            //文字列を選択しているか判定
            if(selectText == '') {
                //選択していない場合、検索画面を表示
                CustomBtn.showSearchWindow('https://jp.finalfantasyxiv.com/lodestone/playguide/db/');
            } else {
                //選択している場合、何件ヒットするか検索
                var searchURL = 'https://jp.finalfantasyxiv.com/lodestone/playguide/db/search/?q=' + selectText;
                GM_xmlhttpRequest({
                    method: 'get',
                    url: searchURL,
                    onload: function(res) {
                        var xml = $.parseHTML(res.responseText);
                        var total = $($('.total',xml)[0]).text();
                        var link = $($('.db-search__result',xml)[0]).find('a');
                        if(total == '1' && link.length == 1) {
                            //1件の場合、コードを埋め込む
                            //コードを取得
                            var linkObj = $($('.db-table',xml)).find('.db-table__txt--detail_link');
                            var dispName = linkObj.text();
                            var url = linkObj.attr('href');
                            //コードを埋め込む
                            CustomBtn.embedCode(url,dispName);
                            //ローディング画面を削除
                            CustomBtn.removeLoading();
                        } else {
                            //複数件の場合、検索画面を表示
                            CustomBtn.showSearchWindow(searchURL);
                        }
                    }, onerror: function(res) {
                        //エラーの場合、検索画面を表示
                        console.log(res);
                        CustomBtn.showSearchWindow(searchURL);
                    }, ontimeout: function() {
                        //タイムアウトの場合、検索画面を表示
                        console.log('search Timout');
                        CustomBtn.showSearchWindow(searchURL);
                    }
                });
            }
        }

        /**
        * エオルゼアデータベース検索ボタンを追加する
        */
        function addSearchCodeBtn() {
            //画像挿入ボタンの要素を取得
            var elemAddImageBtn = $('.wysiwyg_menu__item--image');
            if(elemAddImageBtn[0] != null){
                //エオルゼアデータベース検索ボタンのHTMLを定義
                var btnHtml = [
                    '<a id="search_code_btn" href="javascript:void(0)" class="wysiwyg_menu__item wysiwyg_menu__item__search js__tooltip"',
                    'title="エオルゼアデータベースコード埋め込み"></a>'
                ].join('');
                //画像挿入ボタンの右に要素を追加
                $(elemAddImageBtn[0]).after(btnHtml);
                //エオルゼアデータベース検索ボタンのイベント追加
                $('#search_code_btn').on('click',clickSearchCodeBtn);
                //コールバック関数のためにPostMessageイベントを登録
                $(window).on('message', callPostMessageFunction);
            }
        }

        /**
        * エオルゼアデータベース検索画面で詳細URLのリンク押下時の処理
        * @param {event} イベント
        */
        function clickDetailLink(e) {
            //リンクの表示名とURLを取得する
            var linkObj = $(event.target);
            var dispName = linkObj.text();
            var url = linkObj.attr('href');
            //表示元画面に取得データを返却
            window.opener.postMessage([RETURN_CODE_MSG,url,dispName], targetURL);
            //画面を閉じる
            window.open('about:blank','_self').close();
        }

        /**
        * エオルゼアデータベース検索画面にイベントを追加
        */
        function addSearchCodeEvent() {
            //詳細URLのリンクを押下時
            $('.db-table').on('click','.db-table__txt--detail_link',clickDetailLink);
            $('#eorzeadb_tooltip').on('click','a',clickDetailLink);
        }

        /**
        * ローディング画面クリック時に検索を中断する。
        */
        function clickLoading() {
            // エオルゼアデータベース検索画面が表示されている場合、画面を閉じる
            if( (searchWinObj) && (!searchWinObj.closed) ){
                searchWinObj.close();
            }
            //ローディング画面を削除
            CustomBtn.removeLoading();
        }

        /**
        * エオルゼアデータベース検索画面の表示チェック
        */
        function checkSearchCodeWindow() {
            if( (searchWinObj) && (searchWinObj.closed) ){
                // 検索画面が閉じたらローディング画面を削除
                CustomBtn.removeLoading();
            } else if( (searchWinObj) && !(searchWinObj.closed) ){
                // 検索画面が閉じていない場合、再度チェック
                setTimeout(checkSearchCodeWindow,500);
            }
        }

        /**
        * エオルゼアデータベース検索のPostMessage処理
        * @param {event} イベント
        */
        function callPostMessageFunction(e) {
            var data = e.originalEvent.data;
            if(!Array.isArray(data)) {
                return;
            }
            if(data[0] == RETURN_CODE_MSG) {
                //コードを埋め込む
                CustomBtn.embedCode(data[1],data[2]);
            }
        }

        var global = {

            /**
             * カスタムボタン処理の初期処理
             */
            init: function() {
                if(window.opener != null && window.opener.$('#search_code_btn') != null) {
                    //エオルゼアデータベース検索ボタンからの表示の場合
                    addStyleSheet(SEARCH_CODE_CSS);
                    addSearchCodeEvent();
                    targetURL= window.opener.location.protocol + '//' + window.opener.location.hostname;
                } else {
                    //通常画面表示の場合
                    GM_registerMenuCommand('FF14リッチ編集モードカスタムボタン(設定)', Config.open);
                    addStyleSheet(COMMON_CSS);
                    addCustomTextSizeBtn();
                    addSearchCodeBtn();
                }
            },

            /**
            * 選択した文字列を引数の文字列で囲む
            * @param {badd} 前方文字列
            * @param {aadd} 後方文字列
            */
            bb_ins: function(badd,aadd) {
                $('#input_body').selection('insert', {
                    text: badd,
                    mode: 'before',
                    caret: 'keep'
                }).selection('insert', {
                    text: aadd,
                    mode: 'after',
                    caret: 'keep'
                });
            },

            /**
            * 選択した文字列を引数の文字列で置換
            * @param {rep} 置換後文字列
            */
            bb_rep: function(rep) {
                $('#input_body').selection('replace', {
                    text: rep,
                    caret: 'keep'
                });
            },

            /**
             * エオルゼアデータベース検索画面を表示する
             * @param {url} 画面に表示する文言
            */
            showSearchWindow: function(url){
                // 検索画面表示
                searchWinObj = window.open(url);
                // 検索画面の表示チェック
                checkSearchCodeWindow();
            },

            /**
             * エオルゼアデータベースの検索結果詳細URLと表示名からコードを埋め込む
             * @param {url} 検索結果詳細URL
             * @param {dispName} 表示名
            */
            embedCode: function(url,dispName) {
                //コードを取得
                var codeStr = url.match(/playguide\/db\/(.*)/u);
                codeStr = codeStr[1].replace(/\?.*$/,'');
                var code = codeStr.split('/');
                code = code.filter(Boolean);
                code = code.slice(code.length-2,code.length+1);
                //コードを埋め込む
                CustomBtn.bb_ins('[db:'+code[0]+'='+code[1]+']','[/db:'+code[0]+']');
                CustomBtn.bb_rep(dispName);
            },

            /**
             * ローディング画面を表示する
             * @param {msg} 画面に表示する文言
            */
            dispLoading: function(msg){
                // 引数なし（メッセージなし）を許容
                if( msg == undefined ){
                    msg = '';
                }
                // 画面表示メッセージ
                var dispMsg = '<div class="custom_btn_loading_msg">' + msg + '</div>';
                // ローディング画面が表示されていない場合のみ出力
                if($('#custom_btn_loading').length == 0){
                    $('body').append('<div id="custom_btn_loading">' + dispMsg + '</div>');
                    //ローディング画面のイベント追加
                    $('#custom_btn_loading').on('click',clickLoading);
                }
            },

            /**
             * ローディング画面を削除する
             * @param {msg} 画面に表示する文言
            */
            removeLoading: function(){
                $('#custom_btn_loading').remove();
            }
        };
        return global;
    })();

    //==================================================
    /** 設定関連処理 */
    //==================================================
    //http://d.hatena.ne.jp/h1mesuke/20100713/p1
    (function() {
        Config.define('setting', function() {
            with (this.builder) {
            dialog(
                    'コンフィグ',
                    { width: 600, height: 350, autoReload: false },
                    section(
                            'カスタム文字サイズボタン',
                            'ボタン押下時の文字サイズに関する設定をします。',
                            grid(
                                integer("フォントサイズ", 'font_size', 25), '\n',
                                textarea("ツールチップ", 'tooltip', "カスタム文字サイズ(25)", { cols: 70 })
                            )
                    )
            );
            }
        }, {
            saveKey: 'GM_config',
            aftersave: function() {
                //設定の反映
                settings = Config.load();
                $('#custom_size_btn').attr('title',settings.tooltip);
            },
            afteropen : function() {}
        });
        settings = Config.load();

    })();

    //==================================================
    /** メイン関数 */
    //==================================================
    function main() {
        CustomBtn.init();
    }
    //メイン関数の呼び出し
    main();
})(jQuery);
