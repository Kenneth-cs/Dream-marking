// 微信小程序API测试脚本
// 专门用于小程序环境下的API请求测试

/**
 * 微信小程序环境API测试
 * 注意：此文件应在微信开发者工具中运行
 */

// 测试配置
const TEST_CONFIG = {
  url: 'https://api.coze.cn/v1/workflow/run',
  method: 'POST',
  header: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*',
    'Authorization': 'Bearer pat_55malWmAHkikuRy9hIFpPBrO9YVuouXLc9cUyMra2w321crH7KpjRDUcci5DTQyA'
    // 注意：已移除User-Agent头部，避免"Refused to set unsafe header"错误
  },
  data: {
    workflow_id: "7470173882880966656",
    parameters: {
      input: "测试小程序API连接"
    },
    app_id: "wx154296746927e92f",
    is_async: false
  },
  timeout: 30000
};

// 微信小程序API请求测试函数
function testMiniprogramAPI() {
  console.log('🚀 开始测试微信小程序 Coze API 连接...\n');
  
  console.log('📋 测试配置:');
  console.log('- URL:', TEST_CONFIG.url);
  console.log('- Method:', TEST_CONFIG.method);
  console.log('- Workflow ID:', TEST_CONFIG.data.workflow_id);
  console.log('- App ID:', TEST_CONFIG.data.app_id);
  console.log('- 测试输入:', TEST_CONFIG.data.parameters.input);
  console.log('- 超时时间:', TEST_CONFIG.timeout + 'ms');
  console.log('- 同步模式:', !TEST_CONFIG.data.is_async);
  console.log('\n⏳ 发送请求中...\n');
  
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    wx.request({
      ...TEST_CONFIG,
      success: (res) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        console.log('📊 响应结果:');
        console.log('- 状态码:', res.statusCode);
        console.log('- 响应时间:', responseTime + 'ms');
        console.log('- 头部信息:', res.header);
        
        // 分析响应数据
        console.log('\n📄 详细响应内容:');
        console.log(JSON.stringify(res.data, null, 2));
        
        // 检查响应结构
        console.log('\n🔍 响应结构分析:');
        if (res.data && typeof res.data === 'object') {
          console.log('- 响应格式: JSON ✅');
          
          if (res.data.msg) {
            console.log('- 消息状态:', res.data.msg);
          }
          
          if (res.data.code !== undefined) {
            console.log('- 状态码:', res.data.code);
          }
          
          if (res.data.data) {
            console.log('- 包含数据字段: ✅');
            try {
              let parsedData;
              if (typeof res.data.data === 'string') {
                parsedData = JSON.parse(res.data.data);
              } else {
                parsedData = res.data.data;
              }
              
              if (parsedData.output || parsedData.image_url || parsedData.url) {
                console.log('- 包含图片URL字段: ✅');
              }
              
              if (parsedData.response_for_model || parsedData.wenan || parsedData.text || parsedData.description) {
                console.log('- 包含文案字段: ✅');
              }
              
              if (parsedData.result) {
                console.log('- 包含嵌套结果: ✅');
              }
            } catch (e) {
              console.log('- 数据字段解析失败: ❌', e.message);
            }
          }
        } else {
          console.log('- 响应格式: 非JSON ❌');
        }
        
        // 总结测试结果
        console.log('\n🎯 测试结果总结:');
        
        // HTTP状态分析
        if (res.statusCode === 200) {
          console.log('✅ HTTP状态: 成功 (200)');
        } else if (res.statusCode === 401) {
          console.log('❌ HTTP状态: 认证失败 (401)');
          console.log('   可能原因: API Token无效或已过期');
        } else if (res.statusCode === 429) {
          console.log('⚠️  HTTP状态: 请求过于频繁 (429)');
          console.log('   建议: 稍后重试');
        } else if (res.statusCode === 400) {
          console.log('❌ HTTP状态: 请求参数错误 (400)');
          console.log('   可能原因: workflow_id或app_id不正确');
        } else {
          console.log(`❌ HTTP状态: 请求失败 (${res.statusCode})`);
        }
        
        // API响应分析
        if (res.data && (res.data.msg === 'Success' || res.data.code === 0)) {
          console.log('✅ API响应: 成功');
        } else {
          console.log('❌ API响应: 失败或异常');
          if (res.data && res.data.message) {
            console.log('   错误信息:', res.data.message);
          }
        }
        
        // 响应速度分析
        if (responseTime < 3000) {
          console.log('✅ 响应速度: 优秀 (' + responseTime + 'ms)');
        } else if (responseTime < 5000) {
          console.log('✅ 响应速度: 良好 (' + responseTime + 'ms)');
        } else if (responseTime < 10000) {
          console.log('⚠️  响应速度: 一般 (' + responseTime + 'ms)');
        } else {
          console.log('❌ 响应速度: 较慢 (' + responseTime + 'ms)');
        }
        
        console.log('\n🏁 测试完成');
        resolve({
          success: true,
          statusCode: res.statusCode,
          responseTime,
          data: res.data
        });
      },
      fail: (error) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        console.log('\n❌ 测试失败:');
        console.log('- 耗时:', responseTime + 'ms');
        console.log('- 错误信息:', error.errMsg);
        
        // 分析常见错误
        if (error.errMsg.includes('timeout')) {
          console.log('- 错误类型: 请求超时');
          console.log('- 可能原因: 网络连接慢或服务器响应慢');
        } else if (error.errMsg.includes('fail')) {
          console.log('- 错误类型: 网络请求失败');
          console.log('- 可能原因: 网络连接问题或服务器不可达');
        } else if (error.errMsg.includes('User-Agent')) {
          console.log('- 错误类型: 头部设置错误');
          console.log('- 可能原因: 尝试设置不安全的头部字段');
        }
        
        console.log('\n🏁 测试完成（失败）');
        reject(error);
      }
    });
  });
}

// 批量测试不同场景
async function runComprehensiveTest() {
  console.log('🔬 开始综合测试...\n');
  
  const testCases = [
    {
      name: '基本API连接测试',
      input: '测试基本连接'
    },
    {
      name: '随机模式测试',
      input: 'random'
    },
    {
      name: '中文输入测试',
      input: '生成一只可爱的小猫咪'
    },
    {
      name: '英文输入测试',
      input: 'Generate a beautiful landscape'
    }
  ];
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n=== 测试 ${i + 1}/${testCases.length}: ${testCase.name} ===`);
    
    // 更新测试输入
    TEST_CONFIG.data.parameters.input = testCase.input;
    
    try {
      await testMiniprogramAPI();
      console.log(`✅ ${testCase.name} - 通过`);
    } catch (error) {
      console.log(`❌ ${testCase.name} - 失败:`, error.errMsg);
    }
    
    // 测试间隔，避免频率限制
    if (i < testCases.length - 1) {
      console.log('\n⏱️  等待3秒后进行下一个测试...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  console.log('\n🎉 综合测试完成！');
}

// 导出测试函数
module.exports = {
  testMiniprogramAPI,
  runComprehensiveTest
};

/**
 * 使用说明：
 * 
 * 1. 在微信开发者工具的控制台中运行：
 *    const test = require('./test/miniprogram-api-test.js');
 *    test.testMiniprogramAPI();
 * 
 * 2. 运行综合测试：
 *    test.runComprehensiveTest();
 * 
 * 3. 或者在页面中调用：
 *    const { testMiniprogramAPI } = require('./test/miniprogram-api-test.js');
 *    testMiniprogramAPI().then(result => {
 *      console.log('测试结果:', result);
 *    }).catch(error => {
 *      console.error('测试失败:', error);
 *    });
 * 
 * 注意事项：
 * - 确保网络连接正常
 * - 确保API Token有效
 * - 避免频繁测试，防止触发频率限制
 * - 在真机上测试时注意网络环境差异
 */