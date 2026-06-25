export function PrivacyContent({ locale }: { locale: "zh" | "en" }) {
  if (locale === "en") return <PrivacyEn />;
  return <PrivacyZh />;
}

function PrivacyZh() {
  return (
    <div className="mt-10 space-y-8 text-sm leading-relaxed text-white/70">
      <section>
        <h2 className="text-base font-semibold text-white">1. 简介</h2>
        <p className="mt-3">
          CupOracle（以下简称「本平台」，网址{" "}
          <a href="https://cuporacle.com" className="text-cyan-300/90 hover:text-cyan-200 underline underline-offset-2">
            cuporacle.com
          </a>
          ）是一款世界杯赛事 AI 预测信息平台。我们重视您的隐私。本政策说明我们收集哪些信息、如何使用，以及您享有的权利。
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-white">2. 我们收集的信息</h2>
        <ul className="mt-3 list-disc pl-5 space-y-2">
          <li><strong className="text-white/85">自动收集的技术信息</strong>：访问时浏览器自动发送的数据，例如 IP 地址、设备类型、浏览器类型、访问页面与时间戳。</li>
          <li><strong className="text-white/85">本地存储</strong>：为改善体验，我们可能使用浏览器本地存储或 Cookie 保存偏好设置（如推送通知订阅状态）。</li>
          <li><strong className="text-white/85">推送通知</strong>：若您主动开启 Web Push，我们会保存推送订阅所需的端点信息，仅用于向您发送赛事相关通知。</li>
        </ul>
        <p className="mt-3">本平台不要求用户注册账号，也不主动收集姓名、邮箱等可直接识别个人身份的信息。</p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-white">3. 第三方服务与 Google AdSense</h2>
        <p className="mt-3">本平台使用 Google AdSense 展示广告。Google 及其合作伙伴可能使用 Cookie、设备标识符或类似技术，根据您对本平台及互联网上其他网站的访问记录，向您展示个性化或非个性化广告。</p>
        <p className="mt-3">
          相关数据处理受 Google 隐私政策约束。您可访问{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-cyan-300/90 hover:text-cyan-200 underline underline-offset-2">Google 隐私政策</a>{" "}
          与{" "}
          <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-cyan-300/90 hover:text-cyan-200 underline underline-offset-2">Google 广告技术说明</a>{" "}
          了解详情。
        </p>
        <p className="mt-3">
          您可通过{" "}
          <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-cyan-300/90 hover:text-cyan-200 underline underline-offset-2">Google 广告设置</a>{" "}
          管理个性化广告偏好，或在浏览器中禁用 Cookie。
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-white">4. 分析与托管</h2>
        <p className="mt-3">本平台托管于 Cloudflare Pages，并使用 Cloudflare 提供的性能与安全服务。访问日志可能由 Cloudflare 按其后端政策处理。</p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-white">5. 信息使用目的</h2>
        <ul className="mt-3 list-disc pl-5 space-y-2">
          <li>提供、维护与改进预测内容与网站功能；</li>
          <li>展示广告并衡量广告效果（通过 Google AdSense）；</li>
          <li>在您同意的前提下发送推送通知；</li>
          <li>保障平台安全、防止滥用。</li>
        </ul>
      </section>
      <section>
        <h2 className="text-base font-semibold text-white">6. 数据共享</h2>
        <p className="mt-3">除上文所述的第三方服务提供商（如 Google、Cloudflare）外，我们不会出售您的个人信息。仅在法律要求或保护本平台合法权益所必要时，方可能披露相关信息。</p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-white">7. 您的权利</h2>
        <p className="mt-3">根据适用法律，您可能享有访问、更正或删除个人数据的权利。由于本平台不建立用户账号，大部分数据以匿名或聚合形式存在。如有隐私相关疑问，请通过下方联系方式与我们联系。</p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-white">8. 儿童隐私</h2>
        <p className="mt-3">本平台不面向 13 周岁以下儿童。我们不会故意收集儿童的个人信息。</p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-white">9. 政策更新</h2>
        <p className="mt-3">我们可能不时更新本政策。重大变更将在本页公布并更新「最后更新」日期。继续使用本平台即表示您接受修订后的政策。</p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-white">10. 联系我们</h2>
        <p className="mt-3">
          如有隐私相关问题，请发送邮件至{" "}
          <a href="mailto:admin@cuporacle.com" className="text-cyan-300/90 hover:text-cyan-200 underline underline-offset-2">admin@cuporacle.com</a>。
        </p>
      </section>
    </div>
  );
}

function PrivacyEn() {
  return (
    <div className="mt-10 space-y-8 text-sm leading-relaxed text-white/70">
      <section>
        <h2 className="text-base font-semibold text-white">1. Introduction</h2>
        <p className="mt-3">
          CupOracle (&quot;this platform&quot;, at{" "}
          <a href="https://cuporacle.com" className="text-cyan-300/90 hover:text-cyan-200 underline underline-offset-2">
            cuporacle.com
          </a>
          ) is a World Cup AI prediction information platform. We value your privacy. This policy explains what information we collect, how we use it, and your rights.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-white">2. Information We Collect</h2>
        <ul className="mt-3 list-disc pl-5 space-y-2">
          <li><strong className="text-white/85">Automatically collected technical data</strong>: data your browser sends on visit, such as IP address, device type, browser type, pages visited, and timestamps.</li>
          <li><strong className="text-white/85">Local storage</strong>: we may use browser local storage or cookies to save preferences (e.g. push notification subscription status).</li>
          <li><strong className="text-white/85">Push notifications</strong>: if you enable Web Push, we store endpoint information needed to send match-related notifications.</li>
        </ul>
        <p className="mt-3">We do not require account registration and do not actively collect directly identifiable personal information such as name or email.</p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-white">3. Third-Party Services & Google AdSense</h2>
        <p className="mt-3">We use Google AdSense to display ads. Google and its partners may use cookies, device identifiers, or similar technologies to show personalized or non-personalized ads based on your visits to this site and others.</p>
        <p className="mt-3">
          Processing is governed by Google&apos;s policies. See{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-cyan-300/90 hover:text-cyan-200 underline underline-offset-2">Google Privacy Policy</a>{" "}
          and{" "}
          <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-cyan-300/90 hover:text-cyan-200 underline underline-offset-2">Google Ads technologies</a>.
        </p>
        <p className="mt-3">
          Manage ad preferences at{" "}
          <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-cyan-300/90 hover:text-cyan-200 underline underline-offset-2">Google Ad Settings</a>, or disable cookies in your browser.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-white">4. Analytics & Hosting</h2>
        <p className="mt-3">This site is hosted on Cloudflare Pages with performance and security services. Access logs may be processed by Cloudflare per their policies.</p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-white">5. How We Use Information</h2>
        <ul className="mt-3 list-disc pl-5 space-y-2">
          <li>Provide, maintain, and improve predictions and site features;</li>
          <li>Display ads and measure effectiveness (via Google AdSense);</li>
          <li>Send push notifications with your consent;</li>
          <li>Protect platform security and prevent abuse.</li>
        </ul>
      </section>
      <section>
        <h2 className="text-base font-semibold text-white">6. Data Sharing</h2>
        <p className="mt-3">We do not sell your personal information except as described with service providers (e.g. Google, Cloudflare). We may disclose information when required by law or to protect our legitimate interests.</p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-white">7. Your Rights</h2>
        <p className="mt-3">Depending on applicable law, you may have rights to access, correct, or delete personal data. Since we do not maintain user accounts, most data exists in anonymous or aggregated form. Contact us below with privacy questions.</p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-white">8. Children&apos;s Privacy</h2>
        <p className="mt-3">This platform is not directed at children under 13. We do not knowingly collect children&apos;s personal information.</p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-white">9. Policy Updates</h2>
        <p className="mt-3">We may update this policy from time to time. Material changes will be posted here with an updated date. Continued use means you accept the revised policy.</p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-white">10. Contact Us</h2>
        <p className="mt-3">
          For privacy inquiries, email{" "}
          <a href="mailto:admin@cuporacle.com" className="text-cyan-300/90 hover:text-cyan-200 underline underline-offset-2">admin@cuporacle.com</a>.
        </p>
      </section>
    </div>
  );
}
