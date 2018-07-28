// ==UserScript==
// @name        FF14リッチ編集モードカスタムボタン追加スクリプト
// @namespace   nohohon
// @author      nohohon
// @description FF14のリッチ編集モードでカスタムボタンを追加する
// @include     https://jp.finalfantasyxiv.com/lodestone/my/blog/*
// @include     https://jp.finalfantasyxiv.com/lodestone/my/event/post/*
// @include     http://jp.finalfantasyxiv.com/lodestone/my/blog/*
// @include     http://jp.finalfantasyxiv.com/lodestone/my/event/post/*
// @version     1.0.0
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// @grant       GM_log
// @grant       GM_registerMenuCommand
// @grant       GM_getResourceText
// @resource    usconfigcss https://cdn.rawgit.com/NohohonNohon/ff14RichEditorCustomBtnScript/master/usconfig.css.template
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// @require     https://cdn.rawgit.com/NohohonNohon/ff14RichEditorCustomBtnScript/master/usconfig.js
// @require     https://cdn.rawgit.com/NohohonNohon/ff14RichEditorCustomBtnScript/master/jquery.selection.js
// ==/UserScript==
(function($) {
    //共通変数
        /** 設定値 */
        var settings = {font_size:'25',tooltip:'カスタム文字サイズ'};


    //==================================================
    /** カスタムボタン処理 */
    //==================================================
    var CustomBtn = (function() {

        /**
        * カスタム文字サイズボタン押下時の処理
        * @param {event} イベント
        */
        function clickCustomTextSizeBtn(e) {
            bb_ins('[size='+settings.font_size+']', '[/size]');
        }

        /**
        * 選択した文字列を引数の文字列で囲む
        * @param {badd} 前方文字列
        * @param {aadd} 後方文字列
        */
        function bb_ins(badd,aadd) {
            $('#input_body').selection('insert', {
                text: badd,
                mode: 'before',
                caret: 'keep'
            }).selection('insert', {
                text: aadd,
                mode: 'after',
                caret: 'keep'
            });
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
                    '<a id="custom_size_btn" href="javascript:void(0)" class="wysiwyg_menu__item js__tooltip"',
                    ' style="background:url(https://cdn.rawgit.com/NohohonNohon/ff14RichEditorCustomBtnScript/master/img/btn1.png) no-repeat 0 0;"',
                    'title="',
                    settings.tooltip,
                    '"></a>'
                ].join('');
                //極大サイズボタンの下に要素を追加
                $(elemTextBigSizeBtn[0]).after(btnHtml);
                //カスタム文字サイズボタンのイベント追加
                document.getElementById('custom_size_btn').addEventListener('click',clickCustomTextSizeBtn,false);
            }
        }

        var global = {

            /**
             * カスタムボタン処理の初期処理
             */
            init: function() {
                GM_registerMenuCommand('FF14リッチ編集モードカスタムボタン(設定)', Config.open);
                addCustomTextSizeBtn();
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
                    { width: 600, height: 350 },
                    section(
                            'カスタム文字サイズボタン',
                            'ボタン押下時の文字サイズに関する設定をします。',
                            grid(
                                integer("フォントサイズ", 'font_size', 25), '\n',
                                textarea("ツールチップ", 'tooltip', "カスタム文字サイズ", { cols: 70 })
                            )
                    )
            );
            }
        }, {
            saveKey: 'GM_config',
            aftersave: function() {},
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
