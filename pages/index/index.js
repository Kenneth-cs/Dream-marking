// index.js
Page({
  data: {
    prompt: '',
    imageUrl: '',
    wenan: '',
    isLoading: false,
    lastRequestTime: 0,  // 添加上次请求时间记录
    requestInterval: 5000,  // 设置请求间隔为5秒
    showInput: false, // 控制输入框显示
    isInitializing: true, // 控制初始化loading状态
    isRandomMode: false, // 新增：是否为随机抽卡模式
    placeholderImage: '../../assets/placeholder.png', // 新增：默认占位图
    showResponse: false, // 新增：控制回复区域显示
  },

  onLoad() {
    this.checkWorkflowStatus();
  },

  // 检查工作流状态
  async checkWorkflowStatus() {
    try {
      console.log('正在检查模式...');
      
      // 调用模式检查工作流
      const modeResult = await this.checkMode();
      
      console.log('模式检查结果:', modeResult);
      
      if (modeResult === 2) {
        // 随机抽卡模式
        this.setData({
          showInput: false,
          isRandomMode: true,
          placeholderImage: '../../assets/placeholder.png',
          isInitializing: false,
          showResponse: false
        });
        console.log('初始化完成 - 随机抽卡模式');
      } else {
        // 默认模式（模式1或其他）
        this.setData({
          showInput: true,
          isRandomMode: false,
          placeholderImage: '../../assets/placeholder.png',
          isInitializing: false,
          showResponse: true
        });
        console.log('初始化完成 - 默认模式');
      }
      
    } catch (error) {
      console.error('Check workflow status failed:', error);
      wx.showToast({
        title: '初始化失败，请重试',
        icon: 'none',
        duration: 3000
      });
      // 发生错误时默认使用模式1
      this.setData({
        showInput: true,
        isRandomMode: false,
        isInitializing: false,
        showResponse: true
      });
    }
  },

  // 调用模式检查工作流
  async checkMode() {
    try {
      const requestConfig = {
        url: this.API_CONFIG.BASE_URL,
        method: 'POST',
        timeout: this.API_CONFIG.TIMEOUT,
        header: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*',
          'Authorization': this.API_CONFIG.AUTH_TOKEN
        },
        data: {
          workflow_id: this.API_CONFIG.MODE_CHECK_WORKFLOW_ID,
          parameters: {},
          app_id: this.API_CONFIG.APP_ID,
          is_async: false
        }
      };

      const result = await this.executeRequest(requestConfig);
      
      console.log('模式检查API响应:', result.data);
      
      // 解析返回结果
      if (result.data?.msg === 'Success' || result.data?.code === 0) {
        let responseData;
        try {
          if (typeof result.data.data === 'string') {
            responseData = JSON.parse(result.data.data);
          } else if (typeof result.data.data === 'object') {
            responseData = result.data.data;
          } else {
            responseData = result.data;
          }
          
          // 尝试多种可能的字段获取模式值
          const mode = responseData.output || 
                      responseData.mode || 
                      responseData.result ||
                      responseData.value ||
                      1; // 默认返回1
          
          console.log('解析的模式值:', mode);
          return parseInt(mode);
          
        } catch (parseError) {
          console.error('解析模式结果失败:', parseError);
          return 1; // 解析失败默认返回1
        }
      } else {
        console.error('模式检查API返回错误:', result.data);
        return 1; // API错误默认返回1
      }
      
    } catch (error) {
      console.error('模式检查请求失败:', error);
      return 1; // 请求失败默认返回1
    }
  },

  onInputChange(e) {
    this.setData({
      prompt: e.detail.value
    });
  },

  async onGenerateImage() {
    // 如果是随机抽卡模式，直接显示随机图片
    if (this.data.isRandomMode) {
      this.showRandomCard();
      return;
    }

    // 检查请求间隔
    const now = Date.now();
    const timeSinceLastRequest = now - this.data.lastRequestTime;
    if (timeSinceLastRequest < this.data.requestInterval) {
      const waitTime = Math.ceil((this.data.requestInterval - timeSinceLastRequest) / 1000);
      wx.showToast({
        title: `请等待${waitTime}秒后再试`,
        icon: 'none',
        duration: 2000
      });
      return;
    }

    this.setData({ 
      isLoading: true,
      lastRequestTime: now
    });

    try {
      // 使用重构后的makeRequest方法
      const result = await this.makeRequest({
        input: this.data.isRandomMode ? 'random' : this.data.prompt,
        maxRetries: 3,
        enableRetry: true
      });
      
      // 处理响应数据
      console.log('[完整响应数据]', JSON.stringify(result.data, null, 2));
      
      if (result.data?.msg == 'Success' || result.data?.code === 0) {
        let responseData;
        try {
          // 尝试解析data字段
          if (typeof result.data.data === 'string') {
            responseData = JSON.parse(result.data.data);
          } else if (typeof result.data.data === 'object') {
            responseData = result.data.data;
          } else {
            // 如果data字段不存在，尝试直接使用result.data
            responseData = result.data;
          }
          
          console.log('[解析后的响应数据]', responseData);
          
          // 尝试多种可能的字段名获取图片URL
          const imageUrl = responseData.output || 
                           responseData.image_url || 
                           responseData.url || 
                           responseData.result?.output ||
                           responseData.result?.image_url;
          
          // 尝试多种可能的字段名获取文案
          const wenan = responseData.response_for_model || 
                       responseData.wenan || 
                       responseData.text || 
                       responseData.description ||
                       responseData.result?.text ||
                       '生成完成';
          
          if (imageUrl) {
            console.log('[响应处理成功] 图片URL:', imageUrl, '文案:', wenan);
            this.setData({ 
              imageUrl,
              wenan,
              showResponse: true
            });
          } else {
            console.error('[未找到图片URL] 响应数据结构:', responseData);
            throw new Error('响应中未找到图片URL，请检查API返回格式');
          }
        } catch (parseError) {
          console.error('[JSON解析失败]', parseError, '原始数据:', result.data.data);
          throw new Error('响应数据解析失败: ' + parseError.message);
        }
      } else {
        console.error('[API返回错误]', result.data);
        const errorMsg = result.data?.message || 
                        result.data?.error || 
                        result.data?.msg || 
                        'API返回未知错误';
        throw new Error('API请求失败: ' + errorMsg);
      }

    } catch (error) {
      console.error('Generate image failed:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        raw: error
      });
      
      // 根据错误类型显示不同的提示
      let errorMessage = '生成失败，请重试';
      
      if (error.message.includes('rate-limited') || error.message.includes('频率限制')) {
        errorMessage = '请求过于频繁，请稍后再试';
      } else if (error.message.includes('认证失败') || error.message.includes('Unauthorized')) {
        errorMessage = 'API认证失败，请检查token';
      } else if (error.message.includes('网络') || error.message.includes('timeout')) {
        errorMessage = '网络连接异常，请检查网络后重试';
      } else if (error.message.includes('响应数据') || error.message.includes('解析失败')) {
        errorMessage = 'API响应格式异常，请稍后重试';
      } else if (error.message.includes('未找到图片URL')) {
        errorMessage = 'API返回数据异常，未获取到图片';
      } else if (error.message) {
        // 使用具体的错误信息，但限制长度
        errorMessage = error.message.length > 30 ? 
          error.message.substring(0, 30) + '...' : 
          error.message;
      }
      
      console.error('[用户提示错误]', errorMessage, '[原始错误]', error);
      
      wx.showToast({
        title: errorMessage,
        icon: 'none',
        duration: 3000
      });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  // API配置常量
  API_CONFIG: {
    BASE_URL: 'https://api.coze.cn/v1/workflow/run',
    WORKFLOW_ID: '7470173882880966656',
    MODE_CHECK_WORKFLOW_ID: '7478165030510805011', // 新增：模式检查工作流ID
    APP_ID: 'wx154296746927e92f',
    AUTH_TOKEN: 'Bearer pat_55malWmAHkikuRy9hIFpPBrO9YVuouXLc9cUyMra2w321crH7KpjRDUcci5DTQyA',
    TIMEOUT: 30000, // 30秒超时
    MAX_RETRIES: 3,
    RETRY_DELAYS: {
      RATE_LIMIT: 3000, // 频率限制基础延迟
      NETWORK_ERROR: 1000, // 网络错误基础延迟
      SERVER_ERROR: 2000 // 服务器错误基础延迟
    }
  },

  // 随机卡片图片列表
  CARD_IMAGES: [
    '../../assets/placeholder.png',
    '../../assets/placeholder2.png',
    '../../assets/placeholder3.png',
    '../../assets/placeholder4.png',
  ],

  // 创建请求配置
  createRequestConfig(input) {
    return {
      url: this.API_CONFIG.BASE_URL,
      method: 'POST',
      timeout: this.API_CONFIG.TIMEOUT,
      header: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'Authorization': this.API_CONFIG.AUTH_TOKEN
      },
      data: {
        workflow_id: this.API_CONFIG.WORKFLOW_ID,
        parameters: {
          input: input || this.data.prompt
        },
        app_id: this.API_CONFIG.APP_ID,
        is_async: false
      }
    };
  },

  // 判断错误类型
  getErrorType(error) {
    const message = error.message || '';
    const statusCode = error.statusCode;

    if (message.includes('rate-limited') || statusCode === 429) {
      return 'RATE_LIMIT';
    }
    if (statusCode === 401 || message.includes('认证失败')) {
      return 'AUTH_ERROR';
    }
    if (statusCode >= 500 || message.includes('服务器错误')) {
      return 'SERVER_ERROR';
    }
    if (message.includes('网络') || message.includes('timeout')) {
      return 'NETWORK_ERROR';
    }
    return 'UNKNOWN_ERROR';
  },

  // 获取重试延迟时间
  getRetryDelay(errorType, attemptIndex) {
    const delays = this.API_CONFIG.RETRY_DELAYS;
    const multiplier = attemptIndex + 1;
    
    switch (errorType) {
      case 'RATE_LIMIT':
        return delays.RATE_LIMIT * multiplier;
      case 'SERVER_ERROR':
        return delays.SERVER_ERROR * multiplier;
      case 'NETWORK_ERROR':
        return delays.NETWORK_ERROR * multiplier;
      default:
        return 1000 * multiplier;
    }
  },

  // 是否应该重试
  shouldRetry(errorType, attemptIndex, maxRetries) {
    if (attemptIndex >= maxRetries) return false;
    
    // 认证错误不重试
    if (errorType === 'AUTH_ERROR') return false;
    
    return true;
  },

  // 执行单次请求
  async executeRequest(requestConfig) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      wx.request({
        ...requestConfig,
        success: (res) => {
          const duration = Date.now() - startTime;
          console.log(`[API请求成功] 状态码: ${res.statusCode}, 耗时: ${duration}ms`);
          
          // 详细的响应日志
          if (res.statusCode === 200) {
            console.log('[API响应数据]', res.data);
            resolve(res);
          } else {
            const error = new Error(`HTTP错误: ${res.statusCode} - ${res.data?.message || '未知错误'}`);
            error.statusCode = res.statusCode;
            error.responseData = res.data;
            reject(error);
          }
        },
        fail: (error) => {
          const duration = Date.now() - startTime;
          console.error(`[API请求失败] 耗时: ${duration}ms, 错误:`, error);
          
          const networkError = new Error(`网络请求失败: ${error.errMsg || '未知网络错误'}`);
          networkError.originalError = error;
          reject(networkError);
        }
      });
    });
  },

  // 主要的请求方法 - 重构版本
  async makeRequest(options = {}) {
    const {
      input = null,
      maxRetries = this.API_CONFIG.MAX_RETRIES,
      enableRetry = true
    } = options;

    const requestConfig = this.createRequestConfig(input);
    let lastError = null;
    let attemptIndex = 0;

    console.log(`[开始API请求] 最大重试次数: ${maxRetries}, 输入参数:`, input || this.data.prompt);

    while (attemptIndex <= maxRetries) {
      try {
        console.log(`[第${attemptIndex + 1}次尝试] 发送请求...`);
        
        const result = await this.executeRequest(requestConfig);
        
        // 请求成功，验证响应格式
        if (result.data && typeof result.data === 'object') {
          console.log(`[请求完成] 总尝试次数: ${attemptIndex + 1}`);
          return result;
        } else {
          throw new Error('响应数据格式无效');
        }

      } catch (error) {
        lastError = error;
        const errorType = this.getErrorType(error);
        
        console.warn(`[第${attemptIndex + 1}次请求失败] 错误类型: ${errorType}, 错误信息: ${error.message}`);

        // 如果不启用重试或不应该重试，直接抛出错误
        if (!enableRetry || !this.shouldRetry(errorType, attemptIndex, maxRetries)) {
          console.error(`[请求终止] 不再重试，错误类型: ${errorType}`);
          break;
        }

        // 如果还有重试机会，等待后重试
        if (attemptIndex < maxRetries) {
          const delay = this.getRetryDelay(errorType, attemptIndex);
          console.log(`[准备重试] ${delay}ms后进行第${attemptIndex + 2}次尝试`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        attemptIndex++;
      }
    }

    // 所有重试都失败了
    console.error(`[请求最终失败] 已尝试${attemptIndex}次，最后错误:`, lastError);
    throw lastError || new Error('请求失败，未知错误');
  },

  // 预览图片
  previewImage() {
    if (!this.data.imageUrl) return;
    
    wx.previewImage({
      urls: [this.data.imageUrl],
      current: this.data.imageUrl
    });
  },

  // 显示随机卡片
  showRandomCard() {
    if (this.CARD_IMAGES.length === 0) {
      wx.showToast({
        title: '暂无卡片',
        icon: 'none'
      });
      return;
    }

    // 添加抽卡动画效果
    this.setData({ isLoading: true });

    // 模拟抽卡动画延迟
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * this.CARD_IMAGES.length);
      const randomImage = this.CARD_IMAGES[randomIndex];
      
      this.setData({
        imageUrl: randomImage,
        isLoading: false
      });

      // 可选：添加抽卡成功提示
      wx.showToast({
        title: '抽卡成功！',
        icon: 'success',
        duration: 1500
      });
    }, 800); // 800ms 的抽卡动画时间
  },

  // 保存图片到相册
  saveImage() {
    if (!this.data.imageUrl) return;

    wx.showActionSheet({
      itemList: ['保存到相册'],
      success: () => {
        wx.showLoading({
          title: '保存中...',
        });

        wx.downloadFile({
          url: this.data.imageUrl,
          success: (res) => {
            if (res.statusCode === 200) {
              wx.saveImageToPhotosAlbum({
                filePath: res.tempFilePath,
                success: () => {
                  wx.showToast({
                    title: '已保存到相册',
                    icon: 'success'
                  });
                },
                fail: (err) => {
                  console.error('Save image failed:', err);
                  if (err.errMsg.includes('auth deny')) {
                    wx.showModal({
                      title: '提示',
                      content: '需要您授权保存到相册',
                      success: (res) => {
                        if (res.confirm) {
                          wx.openSetting();
                        }
                      }
                    });
                  } else {
                    wx.showToast({
                      title: '保存失败',
                      icon: 'none'
                    });
                  }
                }
              });
            } else {
              wx.showToast({
                title: '下载图片失败',
                icon: 'none'
              });
            }
          },
          fail: () => {
            wx.showToast({
              title: '下载图片失败',
              icon: 'none'
            });
          },
          complete: () => {
            wx.hideLoading();
          }
        });
      }
    });
  }
});
