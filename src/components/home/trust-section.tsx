import { RotateCcw, Lock, Headphones, Truck } from "lucide-react";
import { Reveal } from "@/components/common/reveal";

const items = [
  {
    icon: Truck,
    title: "Frete grátis",
    subtitle: "Em pedidos acima de R$ 299,00",
  },
  {
    icon: RotateCcw,
    title: "Trocas facilitadas",
    subtitle: "Em até 7 dias",
  },
  {
    icon: Lock,
    title: "Pagamento protegido",
    subtitle: "Ambiente criptografado",
  },
  {
    icon: Headphones,
    title: "Atendimento",
    subtitle: "Estamos aqui para ajudar",
  },
];

export function TrustSection() {
  return (
    <section className="w-full bg-[#0B1A30] py-6 sm:py-8 text-white">
      <div className="container-page">
        <Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex items-center gap-3 rounded-xl bg-white/5 p-3 sm:bg-transparent sm:p-0 sm:px-2"
                >
                  <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                    <Icon className="size-4.5 text-white" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="font-heading text-xs sm:text-sm font-bold text-white leading-tight">
                      {item.title}
                    </h3>
                    <p className="mt-0.5 text-[11px] text-slate-300">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
