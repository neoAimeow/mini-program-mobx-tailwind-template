import { BasePage, page } from '../../base/decorator/page-decorator';

// @page({ observedStores: [new HealthStore(), new HomePageService(), new UserManager(), new SystemInfoStore()] })
@page({ observedStores: [] })
export default class IndexPage extends BasePage<WechatMiniprogram.IAnyObject> {}
