import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Users, Calendar, Coins, ArrowRight, Plus, Bitcoin } from "lucide-react";
import { APP_TITLE } from "@/const";
import { NetworkAware } from "@/components/ui/network-aware";
import { ListSkeleton } from "@/components/ui/skeleton-loader";
import { UserFriendlyError } from "@/components/ui/user-friendly-error";
import { SearchInput } from "@/components/ui/accessible-input";

export default function Groups() {
  const { user, loading: authLoading } = useAuth();
  const { data: groups, isLoading, error, refetch } = trpc.tontine.list.useQuery();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter groups based on search query
  const filteredGroups = groups?.filter((group: any) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (authLoading || isLoading) {
    return (
      <NetworkAware className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
            <ListSkeleton count={6} />
          </div>
        </div>
      </NetworkAware>
    );
  }

  if (error) {
    return (
      <NetworkAware className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <UserFriendlyError
          error={error}
          onRetry={() => refetch()}
          title="Erreur de chargement des groupes"
          retryText="Réessayer"
        />
      </NetworkAware>
    );
  }

  if (!user) {
    return (
      <NetworkAware className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Connexion requise</CardTitle>
            <CardDescription>
              Veuillez vous connecter pour voir et rejoindre les groupes de tontine.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth">
              <Button className="w-full bg-orange-600 hover:bg-orange-700">
                Se connecter
              </Button>
            </Link>
          </CardContent>
        </Card>
      </NetworkAware>
    );
  }

  return (
    <NetworkAware className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Bitcoin className="h-8 w-8 text-orange-600" />
              <h1 className="text-2xl font-bold text-orange-900">{APP_TITLE}</h1>
            </div>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost">Tableau de bord</Button>
            </Link>
            <Link href="/groups/create">
              <Button variant="default" className="bg-orange-600 hover:bg-orange-700">
                <Plus className="mr-2 h-4 w-4" />
                Créer un groupe
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-orange-900 mb-2">Groupes de Tontine</h2>
          <p className="text-gray-600">Parcourez et rejoignez les cercles d'épargne communautaires</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Rechercher un groupe..."
            className="max-w-md"
          />
        </div>

        {filteredGroups.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group: any) => (
              <Card key={group.id} className="hover:shadow-lg transition-shadow border-orange-200">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-xl">{group.name}</CardTitle>
                    <Badge 
                      variant={group.status === "active" ? "default" : "secondary"}
                      className={group.status === "active" ? "bg-green-600" : ""}
                    >
                      {group.status}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {group.description || "No description provided"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-gray-600">
                        <Coins className="h-4 w-4" />
                        Contribution
                      </span>
                      <span className="font-semibold text-orange-900">
                        {group.contributionAmount.toLocaleString()} sats
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        Frequency
                      </span>
                      <span className="font-semibold capitalize">{group.frequency}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-gray-600">
                        <Users className="h-4 w-4" />
                        Members
                      </span>
                      <span className="font-semibold">
                        {group.currentMembers}/{group.maxMembers}
                      </span>
                    </div>
                  </div>

                  <Link href={`/groups/${group.id}`}>
                    <Button className="w-full bg-orange-600 hover:bg-orange-700">
                      Voir les détails
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery ? 'Aucun groupe trouvé' : 'Aucun groupe encore'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? 'Aucun groupe ne correspond à votre recherche'
                  : 'Soyez le premier à créer un groupe de tontine!'
                }
              </p>
              <Link href="/groups/create">
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Créer le premier groupe
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </NetworkAware>
  );
}

