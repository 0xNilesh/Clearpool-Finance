export default function HowItWorks() {
  const steps = [
    {
      num: 1,
      title: "Browse Vaults",
      desc: "Explore curated investment vaults managed by verified professionals",
    },
    {
      num: 2,
      title: "Deposit Funds",
      desc: "Securely deposit your assets with transparent fee structures",
    },
    {
      num: 3,
      title: "Earn Returns",
      desc: "Watch your investments grow with professional management and strategies",
    },
    {
      num: 4,
      title: "Withdraw Anytime",
      desc: "Maintain full control with instant withdrawal capabilities",
    },
  ]

  return (
    <section id="how-it-works" className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">How It Works</h2>
          <p className="text-lg text-muted-foreground">Simple steps to start investing</p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step, idx) => (
            <div key={step.num} className="flex flex-col gap-6 relative">
              {/* Connection line between steps */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute top-6 left-[calc(100%+16px)] w-[calc(100%-32px)] h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
              )}

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold flex-shrink-0">
                  {step.num}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
