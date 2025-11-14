// about.js
Page({
  data: {},

  onLoad() {
    console.log('关于页面加载');
  },

  goBack() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
});
