// ==UserScript==
// @name         AO3 Bookmark Tags Selector
// @namespace    https://github.com/Hibernationnn/AO3-Bookmark-Tag-Selector
// @version      1.4.2
// @description  为 AO3 书签编辑页面添加个人标签库、标签搜索、快捷添加标签块、自动记录确认标签功能。
// @author       Hibernationnn
// @icon         https://raw.githubusercontent.com/Hibernationnn/AO3-Bookmark-Tag-Selector/main/icon.png
// @license      MIT
// @homepageURL  https://greasyfork.org/
// @supportURL   https://greasyfork.org/
// @match        https://archiveofourown.org/*
// @match        https://archive.transformativeworks.org/*
// @match        https://archiveofourown.gay/*
// @grant        none
// @run-at       document-end
// @downloadURL https://update.greasyfork.org/scripts/591250/AO3%20Bookmark%20Tag%20Selector.user.js
// @updateURL https://update.greasyfork.org/scripts/591250/AO3%20Bookmark%20Tag%20Selector.meta.js
// ==/UserScript==


(() => {
    'use strict';

    const STORAGE_KEY =
        'ao3_my_bookmark_tags_v41';

    let myTags = loadTags();

    let myTagsSortMode = 'default';

    /* =========================================================
       基础
    ========================================================= */

    function loadTags() {

        try {

            const data =
                JSON.parse(
                    localStorage.getItem(
                        STORAGE_KEY
                    ) || '[]'
                );

            return Array.isArray(data)
                ? data
                : [];

        } catch {

            return [];
        }
    }


    function saveTags() {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(myTags)
        );
    }
    /* =========================================================
   更新我的标签数量显示
========================================================= */

function updateMyTagsCount() {

    const titleText =
        document.querySelector(
            '#ao3-my-bookmark-tags-title span'
        );


    if (titleText) {

        titleText.textContent =
            `我的标签 (${myTags.length})`;
    }
}

    function clean(text) {

        return String(text || '')
            .replace(/\s+/g, ' ')
            .trim();
    }


    function sameTag(a, b) {

        return a.localeCompare(
            b,
            undefined,
            {
                sensitivity: 'base'
            }
        ) === 0;
    }


    function addToLibrary(tag) {

        tag =
            clean(tag);

        if (!tag) {
            return false;
        }


        if (
            myTags.some(
                old =>
                    sameTag(
                        old,
                        tag
                    )
            )
        ) {

            return false;
        }


        myTags.push(tag);

        return true;
    }


    /* =========================================================
       CSS
    ========================================================= */

    const style =
        document.createElement('style');


    style.id =
        'ao3-my-bookmark-tags-style';


    style.textContent = `

        #ao3-my-bookmark-tags {
            margin-top: .7em;
            padding: .65em;

            border: 1px solid #999;
            border-radius: 5px;

            background: rgba(128,128,128,.08);
        }


        #ao3-my-bookmark-tags-title {
            display: flex;
            align-items: center;
            justify-content: space-between;

            gap: .5em;
            margin-bottom: .4em;

            font-weight: bold;
        }


        /* ===== 小型搜索框 ===== */

        #ao3-my-tags-search {
            display: block;

            width: 100%;
            box-sizing: border-box;

            margin-bottom: .45em;

            padding: .35em .55em;

            border: 1px solid #aaa;
            border-radius: 5px;

            background: rgba(255,255,255,.65);
            color: inherit;

            font: inherit;
            font-size: .85em;

            outline: none;
        }


        #ao3-my-tags-search:focus {
            border-color: #777;
        }


        #ao3-my-tags-search::placeholder {
            opacity: .55;
        }


        /* ===== 标签滚动区域 ===== */

        #ao3-my-bookmark-tags-list {
            display: flex;
            flex-wrap: wrap;

            gap: .35em;

            max-height: 11em;

            overflow-y: auto;
            overflow-x: hidden;

            padding: .1em;

            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain;
        }


        /* ===== 我的标签 ===== */

        .ao3-my-tag {
            display: inline-flex;
            align-items: center;

            max-width: 100%;

            border: 1px solid #999;
            border-radius: 4px;

            overflow: hidden;
        }


        .ao3-my-tag-name,
        .ao3-my-tag-remove {

            border: 0;
            background: transparent;

            color: inherit;
            font: inherit;

            cursor: pointer;
        }


        .ao3-my-tag-name {

            max-width: 220px;

            padding: .28em .5em;

            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }


        .ao3-my-tag-remove {

            padding: .28em .45em;

            border-left: 1px solid #999;

            font-weight: bold;
        }


        .ao3-my-tag:hover {
            filter: brightness(.9);
        }


        #ao3-my-tags-empty {

            opacity: .65;
            font-size: .9em;
        }


        /* ===== 刷新按钮 ===== */

        #ao3-my-tags-refresh {

    width: 1.9em;
    height: 1.9em;

    padding: 0;

    border: 1px solid #999;

    border-radius: 50%;

    background: transparent;

    color: inherit;

    cursor: pointer;

    font-size: .85em;

    display: inline-flex;

    align-items: center;

    justify-content: center;
}


#ao3-my-tags-refresh:hover {

    filter: brightness(.9);
}


        /* ===== 导入按钮 ===== */

        .ao3-import-bookmark-tags {

            margin-left: .5em;

            padding: .2em .5em;

            border: 1px solid #888;
            border-radius: 4px;

            background: transparent;
            color: inherit;

            cursor: pointer;
            font-size: .8em;
        }


        .ao3-import-bookmark-tags:disabled {

            opacity: .6;
            cursor: default;
        }


        /* ===== 导入菜单 ===== */

       .ao3-import-menu {

            position: fixed;

            top:50%;
            left:50%;

            transform:
                translate(-50%,-50%);


            min-width:150px;

            padding:12px;


            /* 弹出动画 */
            animation:
                ao3GlassIn .18s ease-out;


            /*
            Liquid Glass 核心
            */

            background:
                linear-gradient(
                    135deg,
                    rgba(255,255,255,.42),
                    rgba(255,255,255,.18)
                );


            backdrop-filter:
                blur(18px)
                saturate(180%);

            -webkit-backdrop-filter:
                blur(18px)
                saturate(180%);



            /*
            玻璃边缘
            */

            border:
                1px solid
                rgba(255,255,255,.45);



            border-radius:
                22px;



            /*
            外部阴影 + 内部高光
            */

            box-shadow:

                0 20px 50px
                rgba(0,0,0,.18),

                inset 0 1px 2px
                rgba(255,255,255,.65);



            overflow:hidden;


            z-index:
                9999;
        }


        .ao3-import-menu button {


                display:block;

                width:120px;


                margin:.25em auto;


                padding:.45em .8em;



                border:none;


                border-radius:
                    14px;



                background:
                    rgba(255,255,255,.28);



                backdrop-filter:
                    blur(10px);



                -webkit-backdrop-filter:
                    blur(10px);



                color:inherit;


                cursor:pointer;


                transition:
                    .2s;

            }

            .ao3-import-menu button:hover {


            background:
                rgba(255,255,255,.45);


            transform:
                scale(1.03);

        }


        .ao3-import-checkbox-list {

            max-height: 18em;

            overflow-y: auto;

            margin-bottom: .5em;

        }

        @keyframes ao3GlassIn {

            from {
                opacity:0;

                transform:
                    translate(-50%, -55%)
                    scale(.96);
            }

            to {
                opacity:1;

                transform:
                    translate(-50%, -50%)
                    scale(1);
            }
         }

        #ao3-my-tags-sort {
        width:80px !important;
        text-align: center;
        padding-left: 0;
        padding-right: 0;

        appearance: none;
        -webkit-appearance: none;

        width: 70px;
        min-width: 70px;

        padding: .2em .4em;

        margin-left: .5em;

        border-radius: 12px;

        border: none;

        background:
            rgba(255,255,255,.5);

        cursor: pointer;

    }


    `;


    document.head.appendChild(style);


    /* =========================================================
       判断是不是「书签创建者标签」
    ========================================================= */

    function isBookmarkersTagsTitle(text) {

        text =
            clean(text);


        return (

            /Bookmarker's\s+Tags/i.test(text) ||

            /Bookmarker['’]s\s+Tags/i.test(text) ||

            /书签创建者标签/.test(text) ||

            /书签创建者的标签/.test(text) ||

            /书签者标签/.test(text)
        );
    }


    

    /* =========================================================
       找 Bookmarker's Tags 区域
    ========================================================= */

    function findBookmarkersTagsFieldset() {

    const fieldsets = [
        ...document.querySelectorAll(
            'fieldset'
        )
    ];


    for (const fieldset of fieldsets) {

        const legend =
            fieldset.querySelector(
                ':scope > legend'
            );


        if (!legend) {
            continue;
        }


        const title =
            clean(
                legend.textContent
            );


        if (
            isBookmarkersTagsTitle(
                title
            )
        ) {

            return fieldset;
        }
    }


    const headings = [
        ...document.querySelectorAll(
            'legend, dt, h2, h3, h4, h5'
        )
    ];


    const heading =
        headings.find(
            el =>
                isBookmarkersTagsTitle(
                    el.textContent
                )
        );


    if (!heading) {
        return null;
    }


    if (
        heading.tagName.toLowerCase() ===
        'legend'
    ) {

        const parent =
            heading.parentElement;


        if (
            parent &&
            parent.querySelector(
                'input[type="checkbox"]'
            )
        ) {

            return parent;
        }
    }


    let next =
        heading.nextElementSibling;


    if (
        next &&
        next.querySelector &&
        next.querySelector(
            'input[type="checkbox"]'
        )
    ) {

        return next;
    }


    return null;
}


    /* =========================================================
       找 checkbox 对应 label
    ========================================================= */

    function findLabelForInput(
        input,
        section
    ) {

        if (input.id) {

            try {

                const label =
                    section.querySelector(
                        `label[for="${CSS.escape(input.id)}"]`
                    );


                if (label) {
                    return label;
                }

            } catch {}
        }


        const ownLabel =
            input.closest('label');


        if (ownLabel) {
            return ownLabel;
        }


        const li =
            input.closest('li');


        if (li) {

            const label =
                li.querySelector('label');


            if (label) {
                return label;
            }
        }


        return null;
    }


    /* =========================================================
       提取真正的标签名称
    ========================================================= */

    function extractTag(label) {

        const clone =
            label.cloneNode(true);


        clone
            .querySelectorAll(
                'input, button, svg'
            )
            .forEach(
                el =>
                    el.remove()
            );


        let text =
            clean(
                clone.textContent
            );


        text =
            text.replace(
                /\s*\(\d+\)\s*$/,
                ''
            );


        return clean(text);
    }


    /* =========================================================
       读取 Bookmarker's Tags
    ========================================================= */

    function readBookmarkersTags() {

        const section =
            findBookmarkersTagsFieldset();


        if (!section) {

            return {
                found: false,
                tags: []
            };
        }


        const result = [];


        const inputs =
            section.querySelectorAll(
                'input[type="checkbox"]'
            );


        inputs.forEach(
            input => {

                const label =
                    findLabelForInput(
                        input,
                        section
                    );


                if (!label) {
                    return;
                }


                const tag =
                    extractTag(label);


                if (!tag) {
                    return;
                }


                if (
                    isBookmarkersTagsTitle(
                        tag
                    )
                ) {

                    return;
                }


                if (
                    !result.some(
                        old =>
                            sameTag(
                                old,
                                tag
                            )
                    )
                ) {

                    result.push(tag);
                }
            }
        );


        return {
            found: true,
            tags: result
        };
    }
    /* =========================================================
   获取可导入的新标签数量
    ========================================================= */

function getNewImportCount() {

    const result =
        readBookmarkersTags();


    if (!result.found) {

        return 0;
    }


    return result.tags.filter(
        tag =>
            !myTags.some(
                old =>
                    sameTag(
                        old,
                        tag
                    )
            )
    ).length;
}

function updateImportButtonCount(button) {

    const count =
        getNewImportCount();


    button.textContent =
        `导入到我的标签 (${count})`;
}

    /* =========================================================
       导入按钮
    ========================================================= */

function createImportButton() {

    const section =
        findBookmarkersTagsFieldset();


    if (!section) {
        return;
    }


    if (
        section.querySelector(
            '.ao3-import-bookmark-tags'
        )
    ) {

        return;
    }


    const button =
        document.createElement(
            'button'
        );


    button.type =
        'button';


    button.className =
        'ao3-import-bookmark-tags';


    // 初次显示数量
    updateImportButtonCount(button);



    button.addEventListener(
    'click',
    () => {

        showImportMenu(button);

    }
);


    const legend =
        section.querySelector(
            ':scope > legend'
        );


    if (legend) {

        legend.appendChild(
            button
        );

    } else {

        section.prepend(
            button
        );
    }
}
function showImportMenu(button) {


    const old =
        document.querySelector(
            '.ao3-import-menu'
        );


    if (old) {

        old.remove();

        return;
    }



    const menu =
        document.createElement(
            'div'
        );


    menu.className =
        'ao3-import-menu';



    const all =
        document.createElement(
            'button'
        );


    all.type =
        'button';


    all.textContent =
        '全部导入';



    const part =
        document.createElement(
            'button'
        );


    part.type =
        'button';


    part.textContent =
        '部分导入';



    menu.append(
        all,
        part
    );



    document.body.appendChild(
    menu
    );

    document.addEventListener(
    'click',
    function closeImportMenu(event) {

        if (
            !menu.contains(event.target) &&
            event.target !== button
        ) {

            menu.remove();

            document.removeEventListener(
                'click',
                closeImportMenu
            );
        }

    },
    true
        );



    // =====================
    // 全部导入
    // =====================

    all.onclick =
        () => {


            const result =
                readBookmarkersTags();



            let added = 0;



            result.tags.forEach(
                tag => {

                    if (
                        addToLibrary(tag)
                    ) {

                        added++;

                    }

                }
            );



            if (added > 0) {

            saveTags();

            updateMyTagsCount();


            setTimeout(
                () => {

                    const input =
                        document.querySelector(
                            '#bookmark_tag_string_autocomplete, #bookmark_tag_string, input[name="bookmark[tag_string]"]'
                        );


                    const search =
                        document.getElementById(
                            'ao3-my-tags-search'
                        );


                    if (input) {

                        renderCandidates(
                            input,
                            search
                                ? search.value
                                : ''
                        );

                    }

                },
                0
            );

        }

            



            button.textContent =
                `已导入 ${added} 个`;



            setTimeout(
                () => {

                    updateImportButtonCount(
                        button
                    );

                },
                1500
            );



            menu.remove();

        };




    // =====================
    // 部分导入
    // =====================

    part.onclick =
        () => {

            menu.remove();

            showPartialImport();

        };


}

function showPartialImport(){


    const result =
        readBookmarkersTags();



    if (!result.found) {

        return;

    }



    const available =
        result.tags.filter(
            tag =>

                !myTags.some(
                    old =>
                        sameTag(
                            old,
                            tag
                        )
                )
        );



    if (
        available.length === 0
    ) {

        alert(
            '没有新的标签可以导入'
        );

        return;

    }



    const box =
        document.createElement(
            'div'
        );


    box.className =
        'ao3-import-menu';



    const list =
        document.createElement(
            'div'
        );


    list.className =
        'ao3-import-checkbox-list';



    const checks = [];



    available.forEach(
        tag => {


            const label =
                document.createElement(
                    'label'
                );


            const checkbox =
                document.createElement(
                    'input'
                );


            checkbox.type =
                'checkbox';


            checkbox.checked =
                true;


            checkbox.value =
                tag;



            label.append(
                checkbox,
                ' ',
                tag
            );



            list.appendChild(
                label
            );


            list.appendChild(
                document.createElement(
                    'br'
                )
            );


            checks.push(
                checkbox
            );

        }
    );



    const confirm =
        document.createElement(
            'button'
        );


    confirm.type =
        'button';


    confirm.textContent =
        '导入选中标签';



    confirm.onclick =
        () => {


            let added = 0;



            checks
                .filter(
                    c =>
                        c.checked
                )
                .forEach(
                    c => {


                        if (
                            addToLibrary(
                                c.value
                            )
                        ) {

                            added++;

                        }

                    }
                );



            if (added > 0) {

            saveTags();

            updateMyTagsCount();


            /*
            * 立即刷新「我的标签」列表
            * 不需要刷新页面
            */

            const search =
                document.getElementById(
                    'ao3-my-tags-search'
                );


            const input =
                findYourTagsInput();


            if (input) {

                renderCandidates(
                    input,
                    search
                        ? search.value
                        : ''
                );

            }



            /*
            * 更新导入按钮数量
            */

            document
                .querySelectorAll(
                    '.ao3-import-bookmark-tags'
                )
                .forEach(
                    button => {

                        updateImportButtonCount(
                            button
                        );

                    }
                );

        }



            box.remove();

        };



    box.append(
        list,
        confirm
    );



    document.body.appendChild(
        box
    );

    setTimeout(
    () => {

        document.addEventListener(
            'click',
            function closePartialImport(event) {

                if (
                    !box.contains(event.target)
                ) {

                    box.remove();

                    document.removeEventListener(
                        'click',
                        closePartialImport
                    );
                }

            },
            true
        );

    },
    100
        );

}

    /* =========================================================
       找 AO3 标签输入框
    ========================================================= */

function findYourTagsInput() {

        const candidates = [

            '#bookmark_tag_string_autocomplete',

            '#bookmark_tag_string',

            'input[name="bookmark[tag_string]"]'
        ];


        for (
            const selector of candidates
        ) {

            const elements =
                document.querySelectorAll(
                    selector
                );


            for (
                const el of elements
            ) {

                if (
                    !el.disabled &&
                    el.offsetParent !== null
                ) {

                    return el;
                }
            }
        }


        return null;
    }


    /* =========================================================
       当前输入框里的标签
    ========================================================= */

    function getInputTags(input) {

        return input.value
            .split(',')
            .map(clean)
            .filter(Boolean);
    }


    /* =========================================================
       从 AO3 标签块提取文字
    ========================================================= */

    function getTagTextFromNode(node) {

        if (!node) {
            return '';
        }


        const clone =
            node.cloneNode(true);


        clone
            .querySelectorAll(
                '.delete, button, input, svg'
            )
            .forEach(
                el =>
                    el.remove()
            );


        let text =
            clean(
                clone.textContent
            );


        text =
            text.replace(
                /\s*[×✕]\s*$/,
                ''
            );


        return clean(text);
    }


    /* =========================================================
       获取当前 AO3 已经存在的标签
    ========================================================= */

    function getExistingAOTags() {

        const nodes =
            document.querySelectorAll(
                '.added.tag'
            );


        const result = [];


        nodes.forEach(
            node => {

                const text =
                    getTagTextFromNode(
                        node
                    );


                if (
                    text &&
                    !result.some(
                        old =>
                            sameTag(
                                old,
                                text
                            )
                    )
                ) {

                    result.push(text);
                }
            }
        );


        return result;
    }


    /* =========================================================
       ★ 添加候选标签
       
       点击「我的标签」以后：
       
           我的标签
                ↓
           AO3 标签输入框
                ↓
           AO3 确认
                ↓
           .added.tag
       
       不再主动 focus 输入框，
       减少闪烁。
    ========================================================= */

    function addTagToInput(
        input,
        tag
    ) {

        tag =
            clean(tag);


        if (!tag) {
            return;
        }


        /* -----------------------------------------------------
           已经存在的标签不重复添加
        ----------------------------------------------------- */

        const existingTags =
            getExistingAOTags();


        if (
            existingTags.some(
                old =>
                    sameTag(
                        old,
                        tag
                    )
            )
        ) {

            return;
        }


        /* -----------------------------------------------------
           如果当前输入框里正在输入内容，
           直接用候选标签替换当前内容。
           
           例如：
           
               输入：Fin
               点击：Finished Reading
           
           最终只会得到：
           
               Finished Reading
        ----------------------------------------------------- */

        input.value =
            tag;


        /*
         * 告诉 AO3 autocomplete：
         * 输入发生了变化。
         */
        input.dispatchEvent(
            new Event(
                'input',
                {
                    bubbles: true
                }
            )
        );


        /* -----------------------------------------------------
           下一帧直接让 AO3 确认。
           
           使用 requestAnimationFrame，
           不使用原来的 30ms setTimeout。
           
           同时不调用 input.focus()。
        ----------------------------------------------------- */

        requestAnimationFrame(
            () => {

                /*
                 * 如果 AO3 在 input 事件后
                 * 已经自己生成标签块，就结束。
                 */
                const currentTags =
                    getExistingAOTags();


                if (
                    currentTags.some(
                        old =>
                            sameTag(
                                old,
                                tag
                            )
                    )
                ) {

                    return;
                }


                /*
                 * 模拟 Enter。
                 *
                 * AO3 会负责把输入文字
                 * 转换为真正的 .added.tag。
                 */

                input.dispatchEvent(
                    new KeyboardEvent(
                        'keydown',
                        {
                            key: 'Enter',
                            code: 'Enter',
                            keyCode: 13,
                            which: 13,

                            bubbles: true,
                            cancelable: true
                        }
                    )
                );


                /*
                 * 兼容监听 keypress 的情况。
                 */

                input.dispatchEvent(
                    new KeyboardEvent(
                        'keypress',
                        {
                            key: 'Enter',
                            code: 'Enter',
                            keyCode: 13,
                            which: 13,

                            bubbles: true,
                            cancelable: true
                        }
                    )
                );


                /*
                 * 兼容监听 keyup 的情况。
                 */

                input.dispatchEvent(
                    new KeyboardEvent(
                        'keyup',
                        {
                            key: 'Enter',
                            code: 'Enter',
                            keyCode: 13,
                            which: 13,

                            bubbles: true,
                            cancelable: true
                        }
                    )
                );

            }
        );
    }


    /* =========================================================
       候选区
    ========================================================= */

    function createCandidatePanel(
        input
    ) {

        if (
            document.getElementById(
                'ao3-my-bookmark-tags'
            )
        ) {

            return;
        }


        const panel =
            document.createElement(
                'div'
            );


        panel.id =
            'ao3-my-bookmark-tags';


        /* -----------------------------------------------------
           标题
        ----------------------------------------------------- */

        const title =
            document.createElement(
                'div'
            );


        title.id =
            'ao3-my-bookmark-tags-title';


        const titleText =
            document.createElement(
                'span'
            );


        titleText.textContent =
            `我的标签 (${myTags.length})`;


        const refresh =
            document.createElement(
                'button'
            );


        refresh.id =
            'ao3-my-tags-refresh';
            refresh.style.marginLeft = '0 em';


        refresh.type =
            'button';


        refresh.textContent =
            '⟳';

        refresh.title =
            '刷新标签列表';
        
        const sortSelect =
    document.createElement('select');

    sortSelect.addEventListener(
    'change',
    () => {

        myTagsSortMode =
            sortSelect.value;


        const input =
            findYourTagsInput();


        const search =
            document.getElementById(
                'ao3-my-tags-search'
            );


        renderCandidates(
            input,
            search
                ? search.value
                : ''
        );

    }
);

    sortSelect.id =
        'ao3-my-tags-sort';

    sortSelect.style.textAlign = 'center';

    sortSelect.style.appearance = 'none';
    sortSelect.style.webkitAppearance = 'none';

    sortSelect.style.maxWidth = '60px';
    sortSelect.style.minWidth = '0';

    sortSelect.innerHTML = `
    <option value="default">↕ 默认</option>
    <option value="asc">↑ 正序</option>
    <option value="desc">↓ 倒序</option>
    `;
    

    title.style.display = 'flex';
    title.style.alignItems = 'center';

        title.append(
        titleText,
        sortSelect,
        refresh
        
);

    title.style.justifyContent = 'flex-start';
    sortSelect.style.marginLeft = 'auto';


        /* -----------------------------------------------------
           搜索
        ----------------------------------------------------- */

        const search =
            document.createElement(
                'input'
            );


        search.id =
            'ao3-my-tags-search';


        search.type =
            'search';


        search.placeholder =
            '🔍 搜索我的标签…';


        search.autocomplete =
            'off';


        search.spellcheck =
            false;


        /* -----------------------------------------------------
           标签列表
        ----------------------------------------------------- */

        const list =
            document.createElement(
                'div'
            );


        list.id =
            'ao3-my-bookmark-tags-list';


        panel.append(
            title,
            search,
            list
        );


        const dd =
            input.closest('dd');


        if (dd) {

            dd.appendChild(
                panel
            );

        } else {

            input.insertAdjacentElement(
                'afterend',
                panel
            );
        }


        /* -----------------------------------------------------
           刷新
        ----------------------------------------------------- */

        refresh.addEventListener(
            'click',
            () => {

                renderCandidates(
                    input,
                    search.value
                );
            }
        );


        /* -----------------------------------------------------
           搜索
        ----------------------------------------------------- */

        search.addEventListener(
            'input',
            () => {

                renderCandidates(
                    input,
                    search.value
                );
            }
        );


        renderCandidates(
            input,
            ''
        );
    }


    /* =========================================================
       绘制候选标签
    ========================================================= */

    function renderCandidates(
        input,
        keyword = ''
    ) {

        const list =
            document.getElementById(
                'ao3-my-bookmark-tags-list'
            );


        if (!list) {
            return;
        }


        list.replaceChildren();


        const searchText =
            clean(keyword)
                .toLocaleLowerCase();


        const filtered =
            myTags.filter(
                tag =>
                    !searchText ||
                    tag
                        .toLocaleLowerCase()
                        .includes(
                            searchText
                        )
            );

            // 排序
            if (myTagsSortMode === 'asc') {

                filtered.sort(
                    (a, b) =>
                        a.localeCompare(b)
                );

            }


            if (myTagsSortMode === 'desc') {

                filtered.sort(
                    (a, b) =>
                        b.localeCompare(a)
                );

            }


        /* -----------------------------------------------------
           没有任何标签
        ----------------------------------------------------- */

        if (
            myTags.length === 0
        ) {

            const empty =
                document.createElement(
                    'span'
                );


            empty.id =
                'ao3-my-tags-empty';


            empty.textContent =
                '暂无标签，请从“书签创建者标签”导入。';


            list.appendChild(
                empty
            );


            return;
        }


        /* -----------------------------------------------------
           搜索不到
        ----------------------------------------------------- */

        if (
            filtered.length === 0
        ) {

            const empty =
                document.createElement(
                    'span'
                );


            empty.id =
                'ao3-my-tags-empty';


            empty.textContent =
                '没有找到匹配的标签';


            list.appendChild(
                empty
            );


            return;
        }


        /* -----------------------------------------------------
           绘制标签
        ----------------------------------------------------- */

        filtered.forEach(
            tag => {

                const item =
                    document.createElement(
                        'span'
                    );


                item.className =
                    'ao3-my-tag';


                /* =================================================
                   标签名称
                ================================================= */

                const name =
                    document.createElement(
                        'button'
                    );


                name.type =
                    'button';


                name.className =
                    'ao3-my-tag-name';


                name.textContent =
                    tag;


                name.title =
                    '直接添加为 AO3 标签';


                name.addEventListener(
                    'click',
                    event => {

                        event.preventDefault();
                        event.stopPropagation();


                        /*
                         * 点击候选标签以后，
                         * 直接交给 AO3 创建真正的标签块。
                         */
                        addTagToInput(
                            input,
                            tag
                        );
                    }
                );


                /* =================================================
                   删除
                ================================================= */

                const remove =
                    document.createElement(
                        'button'
                    );


                remove.type =
                    'button';


                remove.className =
                    'ao3-my-tag-remove';


                remove.textContent =
                    '×';


                remove.title =
                    '从候选区删除';


                remove.addEventListener(
                    'click',
                    event => {

                        event.preventDefault();
                        event.stopPropagation();


                        myTags =
                            myTags.filter(
                                old =>
                                    !sameTag(
                                        old,
                                        tag
                                    )
                            );


                        saveTags();
                        
                        updateMyTagsCount();
                        
                        document
                            .querySelectorAll(
                                '.ao3-import-bookmark-tags'
                            )
                            .forEach(
                                button => {

                                    updateImportButtonCount(
                                        button
                                    );

                                }
                            );
                        const search =
                            document.getElementById(
                                'ao3-my-tags-search'
                            );


                        renderCandidates(
                            input,
                            search
                                ? search.value
                                : ''
                        );
                    }
                );


                item.append(
                    name,
                    remove
                );


                list.appendChild(
                    item
                );
            }
        );
    }


    /* =========================================================
       保存书签时自动加入新标签
    ========================================================= */

    function watchBookmarkForm(
        input
    ) {

        const form =
            input.closest('form');


        if (!form) {
            return;
        }


        if (
            form.dataset
                .ao3MyBookmarkTagsWatched
        ) {

            return;
        }


        form.dataset
            .ao3MyBookmarkTagsWatched =
            '1';


        form.addEventListener(
            'submit',
            () => {

                const current =
                    getInputTags(
                        input
                    );


                let changed =
                    false;


                current.forEach(
                    tag => {

                        if (
                            addToLibrary(
                                tag
                            )
                        ) {

                            changed =
                                true;
                        }
                    }
                );


                if (changed) {
                    saveTags();
                    updateMyTagsCount();
                }
            },
            true
        );
    }


    /* =========================================================
       监测已经确认的标签
       
       不监听普通 input。
       
       所以：
       
           输入 c
           输入 cr
           输入 cri
       
       不会加入我的标签。
       
       只有 AO3 真正生成 .added.tag
       才会加入。
    ========================================================= */

    function watchTagInput(
        input
    ) {

        if (
            input.dataset
                .ao3MyBookmarkTagsInputWatched
        ) {

            return;
        }


        input.dataset
            .ao3MyBookmarkTagsInputWatched =
            '1';


        const form =
            input.closest('form') ||
            document;


        /*
         * 保存初始化时已经存在的标签。
         *
         * 防止打开编辑书签页面时，
         * 把旧标签重新录入。
         */
        const knownNodes =
            new WeakSet();


        function rememberExistingTags() {

            form
                .querySelectorAll(
                    '.added.tag'
                )
                .forEach(
                    node =>
                        knownNodes.add(
                            node
                        )
                );
        }


        rememberExistingTags();


        /* -----------------------------------------------------
           刷新候选区
        ----------------------------------------------------- */

        function refreshPanel() {

            const search =
                document.getElementById(
                    'ao3-my-tags-search'
                );


            renderCandidates(
                input,
                search
                    ? search.value
                    : ''
            );
        }


        /* -----------------------------------------------------
           加入我的标签
        ----------------------------------------------------- */

        function addConfirmedTag(
            tag
        ) {

            tag =
                clean(tag);


            if (!tag) {
                return;
            }


            /*
             * 防止异常 DOM 内容被当成标签。
             */
            if (
                tag.length > 150
            ) {

                return;
            }


            if (
                addToLibrary(
                    tag
                )
            ) {

                saveTags();

                refreshPanel();
            }
        }


        /* -----------------------------------------------------
           从 AO3 标签块读取名称
        ----------------------------------------------------- */

        function readConfirmedTagNode(
            node
        ) {

            if (!node) {
                return;
            }


            const text =
                getTagTextFromNode(
                    node
                );


            if (!text) {
                return;
            }


            addConfirmedTag(
                text
            );
        }


        /* -----------------------------------------------------
           监听 AO3 DOM
        ----------------------------------------------------- */

        const observer =
            new MutationObserver(
                mutations => {

                    mutations.forEach(
                        mutation => {

                            mutation
                                .addedNodes
                                .forEach(
                                    node => {

                                        if (
                                            node.nodeType !==
                                            Node.ELEMENT_NODE
                                        ) {

                                            return;
                                        }


                                        const elements =
                                            [];


                                        /*
                                         * 自己就是
                                         * .added.tag
                                         */
                                        if (
                                            node.matches &&
                                            node.matches(
                                                '.added.tag'
                                            )
                                        ) {

                                            elements.push(
                                                node
                                            );
                                        }


                                        /*
                                         * 内部存在
                                         * .added.tag
                                         */
                                        if (
                                            node.querySelectorAll
                                        ) {

                                            node
                                                .querySelectorAll(
                                                    '.added.tag'
                                                )
                                                .forEach(
                                                    el =>
                                                        elements.push(
                                                            el
                                                        )
                                                );
                                        }


                                        elements.forEach(
                                            tagNode => {

                                                if (
                                                    knownNodes.has(
                                                        tagNode
                                                    )
                                                ) {

                                                    return;
                                                }


                                                knownNodes.add(
                                                    tagNode
                                                );


                                                readConfirmedTagNode(
                                                    tagNode
                                                );
                                            }
                                        );
                                    }
                                );
                        }
                    );
                }
            );


        observer.observe(
            form,
            {
                childList: true,
                subtree: true
            }
        );


        /* -----------------------------------------------------
           Enter 确认
        ----------------------------------------------------- */

        input.addEventListener(
            'keydown',
            event => {

                if (
                    event.key !== 'Enter'
                ) {

                    return;
                }


                setTimeout(
                    () => {

                        form
                            .querySelectorAll(
                                '.added.tag'
                            )
                            .forEach(
                                node => {

                                    if (
                                        !knownNodes.has(
                                            node
                                        )
                                    ) {

                                        knownNodes.add(
                                            node
                                        );


                                        readConfirmedTagNode(
                                            node
                                        );
                                    }
                                }
                            );

                    },
                    120
                );
            }
        );


        /* -----------------------------------------------------
           点击 AO3 原生自动补全建议
        ----------------------------------------------------- */

        document.addEventListener(
            'click',
            event => {

                const target =
                    event.target;


                if (
                    !target ||
                    !target.closest
                ) {

                    return;
                }


                const suggestion =
                    target.closest(
                        [
                            '.autocomplete li',
                            '.ui-autocomplete li',
                            '.autocomplete .option',
                            '.autocomplete .tag',
                            '[role="option"]'
                        ].join(',')
                    );


                if (!suggestion) {
                    return;
                }


                /*
                 * 不阻止 AO3 原本的点击行为。
                 *
                 * 让 AO3 先处理，
                 * 然后我们读取新生成的
                 * .added.tag。
                 */
                setTimeout(
                    () => {

                        form
                            .querySelectorAll(
                                '.added.tag'
                            )
                            .forEach(
                                node => {

                                    if (
                                        !knownNodes.has(
                                            node
                                        )
                                    ) {

                                        knownNodes.add(
                                            node
                                        );


                                        readConfirmedTagNode(
                                            node
                                        );
                                    }
                                }
                            );

                    },
                    120
                );

            },
            true
        );
    }


    /* =========================================================
       编辑书签
    ========================================================= */

    function setupBookmarkEditor() {

        const input =
            findYourTagsInput();


        if (!input) {
            return;
        }


        createCandidatePanel(
            input
        );


        watchBookmarkForm(
            input
        );


        watchTagInput(
            input
        );
    }


    /* =========================================================
       初始化
    ========================================================= */

    function setup() {

        createImportButton();

        setupBookmarkEditor();
    }


    /* =========================================================
       AO3 动态页面支持
    ========================================================= */

    let timer =
        null;


    const observer =
        new MutationObserver(
            () => {

                clearTimeout(
                    timer
                );


                timer =
                    setTimeout(
                        setup,
                        80
                    );
            }
        );


    observer.observe(
        document.body,
        {
            childList: true,
            subtree: true
        }
    );


    setup();

})();
