'use client';

import React, { useEffect, useMemo, useState } from "react";
import { Bell, CameraIcon, LocateIcon, Mail, Phone, PhoneCall } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import InputField from "@/ui/components/inputField";
import { settingsApi } from "@/lib/api/settings";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { formatApiError } from "@/lib/api/errors";
import { useToast } from "@/ui/components/toast/ToastProvider";
import { withRetry } from "@/lib/api/retry";

type SettingsForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  address: string;
  role: string;
  lastVisit?: string;
};

export default function Page(){
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SettingsForm>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      country: "",
      address: "",
      role: "",
    },
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<SettingsForm | null>(null);
  const accessToken = useAccessToken();
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await withRetry(() => settingsApi.get(accessToken), { retries: 1 });
        if (cancelled) return;
        const resObj = res as unknown as Record<string, unknown>;
        const defaults: SettingsForm = {
          firstName: (resObj.firstName as string) || "",
          lastName: (resObj.lastName as string) || "",
          email: (resObj.email as string) || "",
          phone: (resObj.phone as string) || "",
          country: (resObj.country as string) || "",
          address: (resObj.address as string) || "",
          role: (resObj.role as string) || "Super Admin",
          lastVisit: (resObj.lastVisit as string) || "",
        };
        setProfile(defaults);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.entries(defaults).forEach(([k, v]) => setValue(k as keyof SettingsForm, v as any));
      } catch (err) {
        const friendly = formatApiError(err);
        setError(friendly.message);
        toast.error({ title: "Settings", description: friendly.message });
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [accessToken, setValue, toast]);

  const onSubmit = async (data: SettingsForm) => {
    setSaving(true);
    setError(null);
    try {
      await withRetry(() => settingsApi.update(data, accessToken), { retries: 1 });
      toast.success({ title: "Settings", description: "Paramètres enregistrés." });
      setProfile(data);
    } catch (err) {
      const friendly = formatApiError(err);
      setError(friendly.message);
      toast.error({ title: "Settings", description: friendly.message });
    } finally {
      setSaving(false);
    }
  };

  const fullName = useMemo(() => {
    if (!profile) return "—";
    return [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "—";
  }, [profile]);

  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <div className="bg-neutral shadow-md shadow-white flex flex-col justify-center items-center rounded-md p-4 text-white">
          <div className="bg-slate-100 relative rounded-full w-20 h-20">
            <div className="absolute bottom-0 -right-7 rounded-full bg-primary w-10 h-10 border-2 border-neutral flex items-center justify-center cursor-pointer">
              <CameraIcon className="w-5 h-5 text-black"/>
            </div>
          </div>
          <h1 className="font-bold text-lg mt-4">{fullName}</h1>
          <div className="badge bg-white badge-sm text-black">{profile?.role || "—"}</div>
          <p className="mt-5 font-bold text-sm">Dernière visite {profile?.lastVisit || "—"}</p>
          <button className="btn bg-slate-200 text-black rounded-full button-sm w-full mt-2">Déconnexion</button>
        </div>
        <div className="bg-neutral shadow-md shadow-white p-4 mt-4">
          <div className="flex items-center gap-2 text-slate-200">
            <Bell className="w-4 h-4"/>
            <span>Notifications</span>
          </div>
        </div>
        <div className="bg-neutral shadow-md shadow-white p-4 mt-4">
          <TextWithIcon title={profile?.email || "—"} icon={Mail} />
          <TextWithIcon title={profile?.address || "—"} icon={LocateIcon} subTitle={profile?.country} />
          <TextWithIcon title={profile?.phone || "—"} icon={Phone} />
          <TextWithIcon title={profile?.phone || "—"} icon={PhoneCall} />
          
        </div>
      </div>
      <div className="flex-3 bg-neutral shadow-md shadow-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold mb-4">Profil détail</h2>
          {loading && <span className="text-xs text-white/60">Chargement...</span>}
        </div>
        {error && <div className="alert alert-error text-sm mb-3">{error}</div>}
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field control={control} errors={errors} name="firstName" label="Prénom" />
            <Field control={control} errors={errors} name="lastName" label="Nom" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field control={control} errors={errors} name="email" label="Email" type="email" />
            <Field control={control} errors={errors} name="phone" label="Téléphone" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field control={control} errors={errors} name="country" label="Pays" />
            <Field control={control} errors={errors} name="role" label="Rôle" />
          </div>
          <div>
            <Field control={control} errors={errors} name="address" label="Adresse" />
          </div>
          <div className="flex items-end gap-4">
            <button className="btn bg-[#00BA9D] btn-sm rounded-full px-6" type="submit" disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer Info"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const TextWithIcon = ({title,subTitle,icon:Icon} : {title:string; subTitle?:string; icon:React.ElementType}) => (
  <div className="mb-4 flex items-center gap-2 text-white">
    <Icon className="w-4 h-4"/>
    <div>
      <h2 className="text-sm">{title}</h2>
      {subTitle && <p className="text-md">{subTitle}</p>}
    </div>
  </div>
);

const Field = ({
  control,
  errors,
  name,
  label,
  type = "text",
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: any;
  name: keyof SettingsForm;
  label: string;
  type?: string;
}) => (
  <div className="w-full">
    <label className="label text-sm mb-2" htmlFor={name}>{label}</label>
    <Controller
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      name={name as any}
      control={control}
      rules={{ required: `${label} requis` }}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render={({ field }: any) => <InputField {...field} type={type} value={field.value ?? ""} className="input bg-transparent" />}
    />
    {errors[name] && <p className="text-red-600 text-sm">{errors[name]?.message as string}</p>}
  </div>
);
