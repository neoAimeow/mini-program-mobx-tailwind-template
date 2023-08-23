// index.ts
import { app } from './base/decorator/app-decorator';
import { CatchLog } from './base/decorator/catch-decorator';
import { Logger } from './base/utils/logger';

const TAG = 'APP';
@app({})
export default class App {

    @CatchLog(TAG) async onLaunch() {
        this.checkForUpdate();
        wx.onUnhandledRejection(({ reason }) => {
            Logger.error('unhandled exception', reason);
        });
        wx.onAppHide(() => {
        });
    }

    @CatchLog(TAG) private checkForUpdate() {
        const updateManager = wx.getUpdateManager();
        updateManager.onUpdateReady(function () {
            wx.showModal({
                title: '更新提示',
                content: '新版本已经准备好，是否重启应用？',
                showCancel: false,
                success: function (res) {
                    if (res.confirm) {
                        var env = wx.getAccountInfoSync().miniProgram.envVersion;
                        var version = wx.getAccountInfoSync().miniProgram.version;
                        // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                        wx.removeStorageSync(env + version + 'guide1');
                        wx.removeStorageSync(env + version + 'pre_guide');
                        updateManager.applyUpdate();
                    }
                },
            });
        });
        updateManager.onUpdateFailed(function () {
            // 新版本下载失败
            wx.showModal({
                title: '已经有新版本喽~',
                content: '请您删除当前小程序，到微信 “发现-小程序” 页，重新搜索打开哦~',
                showCancel: false,
            });
        });
    }
}
