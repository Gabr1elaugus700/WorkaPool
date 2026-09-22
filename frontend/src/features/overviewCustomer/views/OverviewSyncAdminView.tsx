import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GrpproSyncAdminPanel } from "@/features/grppro/views/GrpproSyncAdminPanel";
import DefaultLayout from "@/layout/DefaultLayout";
import { OverviewSyncAdminPanel } from "./OverviewSyncAdminPanel";

export function OverviewSyncAdminView() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  if (!isAdmin) {
    return (
      <DefaultLayout>
        <section className="mx-auto max-w-3xl px-6 py-10">
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="text-2xl">Acesso negado</CardTitle>
              <CardDescription>
                Apenas administradores podem operar o sync do Overview.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/" className="text-sm font-medium text-primary underline">
                Voltar ao início
              </Link>
            </CardContent>
          </Card>
        </section>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="mx-auto w-full max-w-[1400px] px-6 pt-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview Customer</TabsTrigger>
            <TabsTrigger value="grppro">Grupos de produto</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <OverviewSyncAdminPanel />
          </TabsContent>
          <TabsContent value="grppro">
            <GrpproSyncAdminPanel />
          </TabsContent>
        </Tabs>
      </div>
    </DefaultLayout>
  );
}

export default OverviewSyncAdminView;
