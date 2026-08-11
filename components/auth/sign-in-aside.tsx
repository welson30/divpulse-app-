const NOTIFICATIONS = [
  {
    logo: "/marketing/signin/notif-jnj.png",
    when: "now",
    title: "JNJ dividend paid",
    meta: "$41.20 · 32 sh × $1.29 settled",
  },
  {
    logo: "/marketing/signin/notif-schd.png",
    when: "1h ago",
    title: "SCHD dividend paid",
    meta: "$63.05 · 74 sh × $0.85 settled",
  },
  {
    logo: "/marketing/signin/notif-o.png",
    when: "3h ago",
    title: "O pays tomorrow",
    meta: "$9.32 estimated · monthly payer",
  },
] as const;

const BARS = [
  { h: 15.2, solid: false },
  { h: 20.8, solid: false },
  { h: 17.6, solid: false },
  { h: 26.4, solid: false },
  { h: 23.2, solid: false },
  { h: 31.2, solid: false },
  { h: 28.4, solid: false },
  { h: 36.8, solid: true },
  { h: 33.6, solid: true },
  { h: 40, solid: true },
] as const;

/**
 * Figma Sign In 8:659 left pane — phone + floating income / channels cards.
 * Desktop ≥1024 shows this panel; smaller viewports hide it (form-first).
 */
export function SignInAside() {
  return (
    <aside className="relative hidden overflow-hidden border-r border-[#22262c] bg-[#121417] min-[1024px]:sticky min-[1024px]:top-0 min-[1024px]:flex min-[1024px]:h-dvh min-[1024px]:flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 50% 40% at 20% 0%, rgba(76,130,247,0.2), transparent 62%), radial-gradient(ellipse 40% 36% at 90% 85%, rgba(63,191,135,0.12), transparent 65%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(#22262c 1px, transparent 1px), linear-gradient(90deg, #22262c 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 40% 30%, black 0%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 40% 30%, black 0%, transparent 80%)",
        }}
      />

      <a
        href="/"
        className="absolute top-9 left-8 z-10 h-10 w-[132px] min-[1200px]:left-14 min-[1200px]:w-[162px] min-[1200px]:h-[49px]"
        aria-label="PaidPrime home"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/marketing/signin/logo.png"
          alt="PaidPrime"
          width={162}
          height={49}
          className="h-full w-full object-contain object-left"
        />
      </a>

      <div className="relative flex flex-1 items-center justify-center px-8 py-16 min-[1200px]:px-14">
        <div className="relative h-[513px] w-[236px] origin-center scale-[0.78] min-[1200px]:scale-100">
          <PhoneLockScreen />

          <div className="pointer-events-none absolute top-[58px] left-[-166px] -rotate-4">
            <IncomeCard />
          </div>
          <div className="pointer-events-none absolute right-[-148px] bottom-[19px] rotate-3">
            <ChannelsCard />
          </div>
        </div>
      </div>
    </aside>
  );
}

function PhoneLockScreen() {
  return (
    <div
      className="relative h-[513px] w-[236px] rounded-[36.58px] shadow-[0px_50px_100px_-35px_rgba(0,0,0,0.9),0px_0px_0px_1px_rgba(255,255,255,0.06)]"
      style={{
        backgroundImage:
          "linear-gradient(150deg, rgb(91, 97, 105) 0%, rgb(32, 36, 42) 22%, rgb(139, 146, 156) 48%, rgb(29, 33, 38) 74%, rgb(74, 80, 88) 100%)",
      }}
    >
      <div className="absolute inset-[6.13px] overflow-hidden rounded-[32.28px] bg-[#0b0c0e]">
        <div
          className="flex h-full flex-col"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(76,130,247,0.3), transparent 62%), linear-gradient(180deg, #0c0f13 0%, #090b0e 100%)",
          }}
        >
          <div className="flex items-center justify-between px-[19px] pt-[16px] text-[8.7px] leading-[14px] font-medium tracking-[-0.17px] text-white/70">
            <span>9:41</span>
            <span>100%</span>
          </div>

          <div className="mt-[25px] flex flex-col items-center gap-1">
            <p className="m-0 text-[45.6px] leading-[46px] font-light tracking-[-1.14px] text-white">
              9:41
            </p>
            <p className="m-0 text-[9.4px] leading-[16px] text-white/50">
              Tuesday, August 4
            </p>
          </div>

          <div className="mt-[18px] flex flex-col items-center gap-[9.4px] px-[13px]">
            {NOTIFICATIONS.map((item) => (
              <div
                key={item.title}
                className="w-full rounded-[20px] border border-white/10 bg-white/[0.09] p-[10.6px] backdrop-blur-[12px]"
              >
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.logo}
                    alt=""
                    width={27}
                    height={13}
                    className="h-[13px] w-[27px] rounded-[3px] object-cover"
                  />
                  <span className="text-[7.9px] leading-[13px] font-medium tracking-[0.94px] text-white/50 uppercase">
                    PaidPrime
                  </span>
                  <span className="ml-auto text-[7.9px] leading-[13px] text-white/40">
                    {item.when}
                  </span>
                </div>
                <p className="m-0 mt-[7px] text-[10.6px] leading-[15px] font-semibold text-white">
                  {item.title}
                </p>
                <p className="m-0 text-[9.4px] leading-[13px] text-white/60">
                  {item.meta}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-auto mb-3 flex justify-center">
            <div className="h-1 w-24 rounded-full bg-white/30" />
          </div>
        </div>
      </div>
      <div className="absolute top-[13px] left-1/2 h-5 w-[71px] -translate-x-1/2 rounded-full bg-black" />
    </div>
  );
}

function IncomeCard() {
  return (
    <div className="w-[168px] rounded-[18px] border border-[#2e343b] bg-[rgba(18,20,23,0.95)] p-4 shadow-[0px_30px_70px_-30px_rgba(0,0,0,0.9)] backdrop-blur-[12px]">
      <div className="flex items-center gap-2">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-[10px] bg-[#10261e]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/marketing/signin/icon-income.svg"
            alt=""
            width={15}
            height={15}
            className="size-[15px]"
          />
        </div>
        <p className="m-0 text-[11px] leading-[18px] font-medium tracking-[1.32px] text-[#6c737f] uppercase">
          Annual
          <br />
          income
        </p>
      </div>
      <p className="m-0 mt-1.5 text-[26px] leading-[26px] font-semibold tracking-[-0.52px] text-[#f2f4f7]">
        $4,220
      </p>
      <p className="m-0 text-[12px] leading-[20px] text-[#3fbf87]">
        +18.4% year over year
      </p>
      <div className="mt-2 flex h-[40px] items-end justify-center gap-[3px]">
        {BARS.map((bar, i) => (
          <span
            key={i}
            className={`w-[10.7px] rounded-t-[2px] ${bar.solid ? "bg-[#4c82f7]" : "bg-[#4c82f7]/32"}`}
            style={{ height: bar.h }}
          />
        ))}
      </div>
    </div>
  );
}

function ChannelsCard() {
  return (
    <div className="w-[176px] rounded-[18px] border border-[#2e343b] bg-[rgba(18,20,23,0.95)] px-4 pt-[15px] pb-4 shadow-[0px_30px_70px_-30px_rgba(0,0,0,0.9)] backdrop-blur-[12px]">
      <p className="m-0 text-[11px] leading-[18px] font-medium tracking-[1.32px] text-[#6c737f] uppercase">
        Alert channels
      </p>
      <div className="mt-3 flex items-center gap-[26px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/marketing/signin/icon-bell.svg" alt="" width={30} height={30} className="size-[30px]" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/marketing/signin/icon-telegram.svg" alt="" width={30} height={30} className="size-[30px]" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/marketing/signin/icon-mail-channel.svg" alt="" width={30} height={30} className="size-[30px]" />
      </div>
      <p className="m-0 mt-3 text-[12px] leading-[20px] text-[#99a1ac]">
        Delivered in under 60
        <br />
        seconds
      </p>
    </div>
  );
}
