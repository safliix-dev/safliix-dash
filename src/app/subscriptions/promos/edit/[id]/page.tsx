'use client';

import Header from "@/ui/components/header";
import FormWithAside from "@/ui/components/formWithAside";
import { usePromoForm } from "./usePromoForm";
import ConfirmationDialog from "@/ui/components/confirmationDialog";
import { Controller } from "react-hook-form";
import InputField from "@/ui/components/inputField";
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
    reset
  } = usePromoForm(id);

  return (
    <div className="space-y-5">
      <Header
        title={isEdit ? "Modifier la promo" : "Créer une promo"}
        className="rounded-2xl border border-base-300 px-5 py-3"
      />

      <FormWithAside>
        <form
          className="bg-neutral rounded-2xl border border-base-300 p-5 space-y-4"
          onSubmit={(e) => { e.preventDefault(); openConfirm(); }}
        >
          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="name"
              control={control}
              rules={{ required: "Nom requis" }}
              render={({ field, fieldState }) => (
                <label className="form-control">
                  <span className="label-text text-white/70 text-sm">Nom</span>
                  <InputField
                    type="text"
                    className="input input-bordered bg-neutral text-white"
                    placeholder="Black Friday"
                    {...field}
                  />
                  {fieldState.error && (
                    <span className="text-red-500 text-xs mt-1">{fieldState.error.message}</span>
                  )}
                </label>
              )}
            />

            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <label className="form-control">
                  <span className="label-text text-white/70 text-sm">Actif</span>
                  <select
                    className="select select-bordered bg-neutral text-white"
                    {...field}
                    value={field.value ? "true" : "false"}
                    onChange={(e) => field.onChange(e.target.value === "true")}
                  >
                    <option value="true">Oui</option>
                    <option value="false">Non</option>
                  </select>
                </label>
              )}
            />

            <Controller
              name="startDate"
              control={control}
              rules={{ required: "Date de début requise" }}
              render={({ field, fieldState }) => (
                <label className="form-control">
                  <span className="label-text text-white/70 text-sm">Date de début</span>
                  <InputField
                    type="date"
                    className="input input-bordered bg-neutral text-white"
                    {...field}
                  />
                  {fieldState.error && (
                    <span className="text-red-500 text-xs mt-1">{fieldState.error.message}</span>
                  )}
                </label>
              )}
            />

            <Controller
              name="endDate"
              control={control}
              rules={{ required: "Date de fin requise" }}
              render={({ field, fieldState }) => (
                <label className="form-control">
                  <span className="label-text text-white/70 text-sm">Date de fin</span>
                  <InputField
                    type="date"
                    className="input input-bordered bg-neutral text-white"
                    {...field}
                  />
                  {fieldState.error && (
                    <span className="text-red-500 text-xs mt-1">{fieldState.error.message}</span>
                  )}
                </label>
              )}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="btn btn-primary rounded-full"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Envoi..."
                : isEdit
                ? "Modifier la promo"
                : "Créer la promo"}
            </button>

            <button
              type="button"
              className="btn btn-ghost border-base-300 rounded-full"
              onClick={() => reset()}
              disabled={isSubmitting}
            >
              Réinitialiser
            </button>
          </div>
        </form>
      </FormWithAside>

      {/* Confirmation */}
      <ConfirmationDialog
        open={dialogOpen}
        title={isEdit ? "Confirmer la modification" : "Confirmer la création"}
        message="Vérifiez les informations avant de les envoyer au serveur."
        status={dialogStatus}
        resultMessage={dialogResult}
        confirmLabel={isEdit ? "Modifier" : "Créer"}
        onCancel={closeDialog}
        onConfirm={confirmSubmit}
      >
        {pendingData && (
          <div className="bg-base-100/10 border border-base-300 rounded-xl p-3 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-white/60">Nom</span>
              <span>{pendingData.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Actif</span>
              <span>{pendingData.isActive ? "Oui" : "Non"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Début</span>
              <span>{pendingData.startDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Fin</span>
              <span>{pendingData.endDate}</span>
            </div>
          </div>
        )}
      </ConfirmationDialog>
    </div>
  );
}
