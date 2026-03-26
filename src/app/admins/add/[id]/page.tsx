'use client';

import { useParams } from "next/navigation";
import { Controller } from "react-hook-form";

import ConfirmationDialog from "@/ui/components/confirmationDialog";
import InputField from "@/ui/components/inputField";
import Header from "@/ui/components/header";
import FormWithAside from "@/ui/components/formWithAside";

import { useAdminForm } from "./useAdminForm";

export default function CreateAdminPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const {
    control,
    isEditMode,

    openConfirm,
    confirmSubmit,
    closeDialog,
    isSubmitting,

    dialogOpen,
    dialogStatus,
    dialogResult,
  } = useAdminForm(id);

  const title = isEditMode ? "Modifier un administrateur" : "Créer un administrateur";

  return (
    <>
      <div className="space-y-6">
        <Header title={title} />

        <FormWithAside>
          <form
            onSubmit={openConfirm}
            className="bg-neutral px-5 py-6 rounded-2xl shadow border border-base-300 space-y-6 overflow-y-auto"
          >
            {/* Prénom / Nom */}
            <div className="flex gap-2">
              <Controller
                name="firstName"
                control={control}
                rules={isEditMode ? {} : { required: "Prénom requis" }}
                render={({ field, fieldState }) => (
                  <InputField {...field} placeholder="Prénom" error={fieldState.error?.message} />
                )}
              />
              <Controller
                name="lastName"
                control={control}
                rules={isEditMode ? {} : { required: "Nom requis" }}
                render={({ field, fieldState }) => (
                  <InputField {...field} placeholder="Nom" error={fieldState.error?.message} />
                )}
              />
            </div>

            {/* Email */}
            <Controller
              name="email"
              control={control}
              rules={isEditMode ? {} : { required: "Email requis" }}
              render={({ field, fieldState }) => (
                <InputField {...field} type="email" placeholder="Email" error={fieldState.error?.message} />
              )}
            />

            {/* Téléphone */}
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <InputField {...field} placeholder="Téléphone" />
              )}
            />

            {/* Pays / Ville */}
            <div className="flex gap-2">
              <Controller
                name="country"
                control={control}
                rules={isEditMode ? {} : { required: "Pays requis" }}
                render={({ field, fieldState }) => (
                  <InputField {...field} placeholder="Pays" error={fieldState.error?.message} />
                )}
              />
              <Controller
                name="city"
                control={control}
                rules={isEditMode ? {} : { required: "Ville requise" }}
                render={({ field, fieldState }) => (
                  <InputField {...field} placeholder="Ville" error={fieldState.error?.message} />
                )}
              />
            </div>

            {/* Password */}
            <div className="flex gap-2">
              <Controller
                name="password"
                control={control}
                rules={isEditMode ? {} : { required: "Mot de passe requis" }}
                render={({ field, fieldState }) => (
                  <InputField
                    {...field}
                    type="password"
                    placeholder="Mot de passe"
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                name="confirmPassword"
                control={control}
                rules={{
                  validate: (value, formValues) => {
                    if (!formValues.password) return true;
                    return value === formValues.password || "Les mots de passe ne correspondent pas";
                  },
                }}
                render={({ field, fieldState }) => (
                  <InputField
                    {...field}
                    type="password"
                    placeholder="Confirmation"
                    error={fieldState.error?.message}
                  />
                )}
              />
            </div>

            {/* Status / Role */}
            <div className="flex gap-2">
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <select {...field} className="select select-bordered w-full">
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                  </select>
                )}
              />
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <select {...field} className="select select-bordered w-full">
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                )}
              />
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                {isEditMode ? "Modifier" : "Créer"}
              </button>
            </div>
          </form>
        </FormWithAside>
      </div>

      <ConfirmationDialog
        open={dialogOpen}
        title="Confirmation"
        message={
          isEditMode
            ? "Voulez-vous confirmer la modification de cet administrateur ?"
            : "Voulez-vous confirmer la création de cet administrateur ?"
        }
        status={dialogStatus}
        resultMessage={dialogResult}
        onConfirm={confirmSubmit}
        onCancel={closeDialog}
      />
    </>
  );
}
