// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
  },
  globalData: {
    appId: 'wxb290629405cf813e', // 更新为新的 AppID
    userInfo: null
  }
})
