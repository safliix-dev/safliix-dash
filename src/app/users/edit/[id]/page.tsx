'use client';

import Header from "@/ui/components/header";
import FormWithAside from "@/ui/components/formWithAside";
import ConfirmationDialog from "@/ui/components/confirmationDialog";
import InputField from "@/ui/components/inputField";
import { Controller } from "react-hook-form";
import { useUserForm } from "./useUserForm";
import { useParams } from "next/navigation";
export default function Page() {

  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const {
    control,
    isSubmitting,
    isEdit,

    openConfirm,
    confirmSubmit,
    closeDialog,

    dialogOpen,
    dialogStatus,
    dialogResult,
    pendingData,
  } = useUserForm(id);

  return (
    <div className="space-y-5">
      <Header
        title={isEdit ? "Modifier un utilisateur" : "Créer un utilisateur"}
      />

      <FormWithAside>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            openConfirm();
          }}
          className="bg-neutral border border-base-300 rounded-2xl p-5 space-y-5"
        >
          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="firstName"
              control={control}
              rules={{ required: "Nom requis" }}
              render={({ field, fieldState }) => (
                <InputField
                  {...field}
                  placeholder="Prénom"
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              name="lastName"
              control={control}
              rules={{ required: "Nom requis" }}
              render={({ field, fieldState }) => (
                <InputField
                  {...field}
                  placeholder="Nom"
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              name="phone"
              control={control}
              rules={{required:false}}
              render={({ field }) => <InputField {...field} placeholder="Téléphone" />}
            />

            <Controller
              name="email"
              control={control}
              rules={{ required: "Email requis" }}
              render={({ field, fieldState }) => (
                <InputField
                  {...field}
                  type="email"
                  placeholder="Email"
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              name="password"
              control={control}
              rules={!isEdit ? { required: "Mot de passe requis" } : undefined}
              render={({ field, fieldState }) => (
                <InputField
                  {...field}
                  type="password"
                  placeholder={isEdit ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              name="confirmPassword"
              control={control}
              rules={!isEdit ? { required: "Mot de passe requis" } : undefined}
              render={({ field, fieldState }) => (
                <InputField
                  {...field}
                  type="password"
                  placeholder={isEdit ? "Nouveau mot de passe (optionnel)" : "Confirmez le mot de passe"}
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <select {...field} className="select select-bordered w-full">
                  <option value="user">Utilisateur</option>
                  <option value="collaborator">Collaborateur</option>
                </select>
              )}
            />

            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <select {...field} className="select select-bordered w-full">
                  <option value="actif">Actif</option>
                  <option value="en attente">En attente</option>
                  <option value="inactif">Inactif</option>
                </select>
              )}
            />

            <Controller
              name="avatarUrl"
              control={control}
              render={({ field }) => (
                <InputField
                  {...field}
                  placeholder="URL de l’avatar"
                />
              )}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="btn btn-primary rounded-full"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Enregistrement..."
                : isEdit
                ? "Modifier l’utilisateur"
                : "Créer l’utilisateur"}
            </button>
          </div>
        </form>
      </FormWithAside>

      {/* Confirmation */}
      <ConfirmationDialog
        open={dialogOpen}
        title={isEdit ? "Confirmer la modification" : "Confirmer la création"}
        message="Vérifiez les informations avant validation."
        status={dialogStatus}
        resultMessage={dialogResult}
        confirmLabel={isEdit ? "Modifier" : "Créer"}
        onCancel={closeDialog}
        onConfirm={confirmSubmit}
      >
        {pendingData && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Nom</span>
              <span>{`${pendingData.firstName} ${pendingData.lastName}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Email</span>
              <span>{pendingData.email}</span>
            </div>
          </div>
        )}
      </ConfirmationDialog>
    </div>
  );
}
