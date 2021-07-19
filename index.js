// ==UserScript==
// @author            lt
// @name              京东订单评价助手
// @description       京东商城商品自动评价脚本
// @match             http://club.jd.com/myJdcomments/myJdcomments.action?sort=0
// @match             https://club.jd.com/myJdcomments/myJdcomments.action?sort=0
// @include           *://club.jd.com/myJdcomments/myJdcomments.action?sort=0
// @version           1.1.1
// @eversion          6
// @connect-src       www.jd.com
// @namespace         https://greasyfork.org/users/177053
// ==/UserScript==

(function() {
  'use strict';

  const contentArr = [
    '商品质量很好，包装很简约扎实，通过包装就能够感受到卖家的那份诚意。很满意，配送速度快，而且配送员态度也非常好。',
    '商品使用过后挺好的，非常实用。京东的物流确实很快，基本上都是准时到达╭(╯3╰)╮',
    '每次再京东商城购买的东西都是非常满意',
    '商品非常好，使用起来非常棒，一起买价格又便宜，快递又快，在京东购买东西还是非常省心的，实时快递位置，随时掌握快递进度，很nice！',
    '活动期间，凑一下买的很实惠，自营品质又值得信赖。',
    '用过的同事都觉得很不错，同事都说好用。下次继续买买买，哈哈哈…',
    '商品上各种成份材料都有明确的标注，能够给我们购买提供很大的参考，毕竟适合自己的才是最好的。商品质量和实体店差不多，并且购买都不用出门',
    '买重要的东西都会在京东上购买，每次购买也都不会让我失望，是一个值得信赖的平台，售后服务那也是相当棒的',
    '完美！虽仅有两个字，但言简意赅'
  ];

  const imageArr = [
    '//img30.360buyimg.com/n1/s760x500_jfs/t17188/258/748561545/385413/42948846/5aa663f7N3b0043d8.jpg',
    '//img30.360buyimg.com/n1/s760x500_jfs/t19360/90/768499013/96345/9d7e7b04/5aa538f2N4391ff9a.jpg',
    '//img30.360buyimg.com/n1/s760x500_jfs/t16111/77/2325069505/162434/72001fc/5aa53213N19d6e87e.jpg',
    '//img30.360buyimg.com/n1/s760x500_jfs/t19567/347/708170556/73539/9c38d423/5aa11321N62483954.jpg',
    '//img30.360buyimg.com/n1/s760x500_jfs/t16306/19/2294392305/297498/7cc81938/5aa0a8c3N3fd0abc0.jpg',
    '//img30.360buyimg.com/n1/s760x500_jfs/t18400/73/638909230/39411/214b185f/5a9e38f6N13172e86.jpg',
    '//img30.360buyimg.com/n1/s760x500_jfs/t15628/85/2177691783/110829/b1c1f19b/5a9806b5Nb1cd797c.jpg',
    '//img30.360buyimg.com/n1/s760x500_jfs/t17494/138/524563219/165913/bfcc179d/5a8985c8Nba2724e9.jpg',
    '//img30.360buyimg.com/n1/s760x500_jfs/t14767/173/2249652486/101499/54828657/5a83e75eN8bc2e2a6.jpg',
    '//img30.360buyimg.com/n1/s760x500_jfs/t18994/89/798457060/284655/24dd84f1/5aa77650N42158426.jpg'
  ];

  let isReviewing = false;
  const INTELVAL = 8000;

  function isElement(el) {
    return el instanceof HTMLElement || (el instanceof jQuery && el.get(0) instanceof HTMLElement);
  }

  function getDOM(elm) {
    return elm instanceof jQuery ? elm.get(0) : elm;
  }

  function random(min, max) {
    let val = Math.random();
    val = (max - min) * val + min;
    return parseInt(val.toString(), 10);
  }

  function sleep(time) {
    return new Promise((res) => setTimeout(res, time));
  }

  function randomArrValue(arr) {
    return arr[random(0, arr.length - 1)];
  }

  function randomSleep() {
    return sleep(random(300, 600));
  }

  function createClickEvent() {
    const e = document.createEvent('MouseEvent');
    e.initEvent('click', true, true);
    return e;
  }

  function clickElement(elm) {
    if (!isElement(elm)) {
      return;
    }
    getDOM(elm).dispatchEvent(createClickEvent());
  }

  function inspectPromiseFn(fn, check, intelval = 100, max = 5) {
    return new Promise((res, rej) => {
      let v;
      let times = 0;
      const r = () => {
        if (check()) {
          res(v)
        } else {
          times += 1;
          if (times >= max) {
            console.error('many try', fn, check);
            rej('many try');
          } else {
            v = fn();
            sleep(intelval).then(r);
          }
        }
      }
      r();
    });
  }

  function checkReviewSuccess(params) {
    const findDialog = () => new Promise(res => {
      const r = () => {
        let dialog = document.querySelector('.ui-dialog');
        if (dialog) {
          res(dialog);
        } else {
          sleep(100).then(r);
        }
      }
    });

    return findDialog()
      .then(dialog => {
        const closeButton = dialog.querySelector('a[title="关闭"]');
        const text = $(dialog).find('.ui-dialog-content .item-fore h3').text();
        const success = text.indexOf('成功') > -1;

        closeButton.dispatchEvent(createClickEvent());
        return success;
      });
  }

  function review(elm) {
    if (!(elm instanceof HTMLElement)) {
      return;
    }

    const content = randomArrValue(contentArr);
    const imageUrl = randomArrValue(imageArr);
    const shouldShowImage = true;

    const $elm = $(elm);
    const elmShowBoxButton = $elm.find('a:contains("点击评价")');
    const elmBox = $elm.find('.comt-box');
    const elmFiveStar = $elm.find('a[title="五星"]');
    const elmInput = $elm.find('textarea');
    const elmSubmit = $elm.find('a:contains("发表评价")');

    const name = $elm.find('.p-name a').text();

    const showCommentBox = () => new Promise(res => {
      const isCommentBoxHidden = !elmBox.attr('style') || elmBox.attr('style').includes('display: none');
      if (isCommentBoxHidden) {
        clickElement(elmShowBoxButton);
        randomSleep().then(res);
      }
      res();
    });

    const showImage = () => new Promise(res => {
      if (shouldShowImage) {
        const uploadImageEl = document.querySelector('input[name="imgs1"]');
        uploadImageEl.value = imageUrl;
        randomSleep().then(res);
      }
      res();
    });

    const end = () => {
      console.log('review', { name, content, imageUrl, shouldShowImage });
    }

    return Promise.resolve()
      .then(showCommentBox)
      .then(() => clickElement(elmFiveStar))
      .then(() => clickElement(elmInput))
      .then(() => elmInput.focus().val(content))
      .then(randomSleep)
      .then(shouldShowImage)
      .then(() => clickElement(elmSubmit))
      .then(end)
      .then(randomSleep)
      .then(checkReviewSuccess)
      .catch(err => console.error('review error', elm, err))
  }

  function main() {
    if (isReviewing) return;

    let list = document.querySelectorAll('.comt-plists .comt-plist');
    list = [].slice.call(list);
    isReviewing = true;

    if (window.$debug) {
      debugger;
    }

    function r() {
      const item = list.shift();

      review(item)
        .then(() => {
          if (list.length > 0 && !window.$stop) {
            setTimeout(r, INTELVAL);
          } else {
            isReviewing = false;
          }
        })
        .catch(err => {
          console.error('review error:', item, err);
        });
    };

    r();
  }

  function createButton(params) {
    const button = document.createElement('button');
    const textNode = document.createTextNode('一键评价');

    button.onclick = main;

    button.style.padding = '3px 10px';
    button.style.boxShadow = '2px 2px 5px 1px rgb(236, 236, 236)';
    button.style.color = 'rgb(50, 50, 50)';

    button.appendChild(textNode);
    return button;
  }

  if (window.location.hostname === 'club.jd.com') {
    const wrapper = document.querySelector('#evalu01 ul.tab');
    const item = document.createElement('li');
    const button = createButton();

    item.appendChild(button);
    wrapper.appendChild(item);

    Object.defineProperty(window, '$stop', {
      value: false,
      enumerable: false,
      configurable: false,
    });

    Object.defineProperty(window, '$debug', {
      value: false,
      enumerable: false,
      configurable: false,
    });
  }
})();
