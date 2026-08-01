# Reduce PDF Size 项目文档

本目录保存网站建设、内容和验收规范。网站源码、构建配置和部署配置统一放在仓库根目录下的 `site/` 中。

## 文档索引

- [product-plan.md](./product-plan.md)：产品目标、功能范围、技术方案和发布方式。
- [seo-content-plan.md](./seo-content-plan.md)：搜索问题归类、页面内容结构和 SEO 写作要求。
- [site-completion-checklist.md](./site-completion-checklist.md)：网站完成后必须逐项核对的验收清单。
- [adsense-progress.md](./adsense-progress.md)：AdSense 申请就绪的审计结论、已完成工作、下一步计划和跨会话交接说明。

## 固定目录约定

- `docs/`：规划、内容规范和验收记录。
- `site/`：网站唯一源码根目录，也是后续构建和上线部署的工作目录。
- 仓库根目录不放网站运行代码，不从仓库根目录执行生产部署。

如果以后增加设计稿、测试样本或审计报告，应继续放在 `docs/` 下的对应子目录中，不要混入 `site/` 的生产源码。
