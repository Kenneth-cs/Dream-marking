// Coze API测试脚本
// 用于测试工作流API请求是否正常工作
// 注意：此文件为Node.js环境测试脚本，不适用于微信小程序环境

const https = require('https');

// 测试配置
const TEST_CONFIG = {
  url: 'https://api.coze.cn/v1/workflow/run',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*',
    'Authorization': 'Bearer pat_55malWmAHkikuRy9hIFpPBrO9YVuouXLc9cUyMra2w321crH7KpjRDUcci5DTQyA'
  },
  data: {
    workflow_id: "7470173882880966656",
    parameters: {
      input: "测试API连接"
    },
    app_id: "wx154296746927e92f",
    is_async: false
  }
};

// 发送HTTP请求的Promise封装
function makeHttpRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// 主测试函数
async function testCozeAPI() {
  console.log('🚀 开始测试 Coze API 连接...\n');
  
  try {
    // 解析URL
    const url = new URL(TEST_CONFIG.url);
    
    // 构建请求选项
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: TEST_CONFIG.headers
    };
    
    // 准备POST数据
    const postData = JSON.stringify(TEST_CONFIG.data);
    
    console.log('📋 测试配置:');
    console.log('- URL:', TEST_CONFIG.url);
    console.log('- Workflow ID:', TEST_CONFIG.data.workflow_id);
    console.log('- App ID:', TEST_CONFIG.data.app_id);
    console.log('- 测试输入:', TEST_CONFIG.data.parameters.input);
    console.log('- 同步模式:', !TEST_CONFIG.data.is_async);
    console.log('\n⏳ 发送请求中...\n');
    
    // 发送请求
    const startTime = Date.now();
    const response = await makeHttpRequest(options, postData);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // 分析响应
    console.log('📊 响应结果:');
    console.log('- 状态码:', response.statusCode);
    console.log('- 响应时间:', responseTime + 'ms');
    console.log('- Content-Type:', response.headers['content-type'] || '未知');
    
    // 解析响应数据
    let responseData;
    try {
      responseData = JSON.parse(response.data);
      console.log('- 响应格式: JSON ✅');
    } catch (e) {
      console.log('- 响应格式: 非JSON ❌');
      console.log('- 原始响应:', response.data.substring(0, 200) + '...');
    }
    
    console.log('\n📄 详细响应内容:');
    if (responseData) {
      console.log(JSON.stringify(responseData, null, 2));
      
      // 检查响应结构
      console.log('\n🔍 响应结构分析:');
      if (responseData.msg) {
        console.log('- 消息状态:', responseData.msg);
      }
      if (responseData.data) {
        console.log('- 包含数据字段: ✅');
        try {
          const parsedData = JSON.parse(responseData.data);
          if (parsedData.output) {
            console.log('- 包含输出字段: ✅');
          }
          if (parsedData.response_for_model || parsedData.wenan) {
            console.log('- 包含文案字段: ✅');
          }
        } catch (e) {
          console.log('- 数据字段解析失败: ❌');
        }
      }
    }
    
    // 总结测试结果
    console.log('\n🎯 测试结果总结:');
    if (response.statusCode === 200) {
      console.log('✅ HTTP状态: 成功');
    } else if (response.statusCode === 401) {
      console.log('❌ HTTP状态: 认证失败 (401)');
      console.log('   可能原因: API Token无效或已过期');
    } else if (response.statusCode === 429) {
      console.log('⚠️  HTTP状态: 请求过于频繁 (429)');
      console.log('   建议: 稍后重试');
    } else {
      console.log(`❌ HTTP状态: 请求失败 (${response.statusCode})`);
    }
    
    if (responseData && responseData.msg === 'Success') {
      console.log('✅ API响应: 成功');
    } else {
      console.log('❌ API响应: 失败或异常');
    }
    
    if (responseTime < 5000) {
      console.log('✅ 响应速度: 良好 (' + responseTime + 'ms)');
    } else {
      console.log('⚠️  响应速度: 较慢 (' + responseTime + 'ms)');
    }
    
  } catch (error) {
    console.log('\n❌ 测试失败:');
    console.log('错误类型:', error.name);
    console.log('错误信息:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('可能原因: 网络连接问题或DNS解析失败');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('可能原因: 服务器拒绝连接');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('可能原因: 请求超时');
    }
  }
  
  console.log('\n🏁 测试完成');
}

// 运行测试
if (require.main === module) {
  testCozeAPI().catch(console.error);
}

module.exports = { testCozeAPI };