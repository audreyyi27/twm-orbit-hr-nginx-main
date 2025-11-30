import HiringManagerSidebar from "@/components/sidebar/sidebar";
export default async function HiringManagerLayout(props: LayoutProps<"/">) {

  return <section className="w-full h-screen flex overflow-hidden">
    <HiringManagerSidebar />
    <main className="px-6 py-4 lg:p-8 grow overflow-auto relative">
      {props.children}
    </main>
  </section>
}