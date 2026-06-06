'use client';

import { useParams } from "next/navigation";
import { Controller } from "react-hook-form";
import Header from "@/ui/components/header";
import FormWithAside from "@/ui/components/formWithAside";
import InputField from "@/ui/components/inputField";
import { useImageRightsForm } from "./useImageRightsForm";
import ConfirmationDialog from "@/ui/components/confirmationDialog";

export default function Page() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const {
    control,
    reset,
    isSubmitting,
    openConfirm,
    confirmSubmit,
    closeDialog,
    dialogOpen,
    dialogStatus,
    dialogResult,
    isEdit,
  } = useImageRightsForm(id);

  

  return (
    <div className="space-y-4">
      <Header title={isEdit ? "Modifier un ayant droit" : "Ajouter un ayant droit"} backHref="/rights-holders" />

      <FormWithAside>
        <form onSubmit={openConfirm} className="bg-neutral border border-base-300 rounded-2xl p-5 space-y-5">
          {/* Identité */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label text-sm mb-1">Prénom{!isEdit && <span className="text-red-500"> *</span>}</label>
              <Controller
                name="firstName"
                control={control}
                rules={{ required: isEdit ? false : "Prénom requis"  }}
                render={({ field, fieldState }) => (
                  <InputField {...field} placeholder="Prénom" error={fieldState.error?.message} />
                )}
              />
            </div>
            <div>
              <label className="label text-sm mb-1">Nom{!isEdit && <span className="text-red-500"> *</span>}</label>
              <Controller
                name="lastName"
                control={control}
                rules={{ required: isEdit ? false : "Nom requis" }}
                render={({ field, fieldState }) => (
                  <InputField {...field} placeholder="Nom" error={fieldState.error?.message} />
                )}
              />
            </div>
            <div>
              <label className="label text-sm mb-1">Rôle / fonction</label>
              <Controller
                name="role"
                control={control}
                rules={{ required: false }}
                render={({ field, fieldState }) => (
                  <InputField {...field} placeholder="Rôle / fonction" error={fieldState.error?.message} />
                )}
              />
            </div>
            <div>
              <label className="label text-sm mb-1">Email <span className="text-red-500">*</span></label>
              <Controller
                name="email"
                control={control}
                rules={{ required: "Email requis" }}
                render={({ field, fieldState }) => (
                  <InputField {...field} type="email" placeholder="Email" error={fieldState.error?.message} />
                )}
              />
            </div>
            <div>
              <label className="label text-sm mb-1">Téléphone{!isEdit && <span className="text-red-500"> *</span>}</label>
              <Controller
                name="phone"
                control={control}
                rules={{ required: isEdit ? false : "Téléphone requis"}}
                render={({ field }) => <InputField {...field} placeholder="Téléphone" />}
              />
            </div>
            <div>
              <label className="label text-sm mb-1">Périmètre d&apos;usage</label>
              <Controller
                name="scope"
                control={control}
                rules={{ required: false }}
                render={({ field, fieldState }) => (
                  <InputField {...field} placeholder="Périmètre d'usage" error={fieldState.error?.message} />
                )}
              />
            </div>
            <div>
              <label className="label text-sm mb-1">Part (%){!isEdit && <span className="text-red-500"> *</span>}</label>
              <Controller
                name="sharePercentage"
                control={control}
                rules={{required: isEdit ? false : "Part requis",  min: { value: 0, message: "Min 0%" } }}
                render={({ field, fieldState }) => (
                  <InputField
                    {...field}
                    type="number"
                    placeholder="Part (%)"
                    error={fieldState.error?.message}
                    value={String(field.value)}
                  />
                )}
              />
            </div>
            <div>
              <label className="label text-sm mb-1">Statut</label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <select {...field} className="select select-bordered w-full">
                    <option value="actif">Actif</option>
                    <option value="en attente">En attente</option>
                    <option value="expiré">Expiré</option>
                  </select>
                )}
              />
            </div>
            <div>
              <label className="label text-sm mb-1">Date de début</label>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => <input {...field} type="date" className="input input-bordered w-full" />}
              />
            </div>
            <div>
              <label className="label text-sm mb-1">Date de fin</label>
              <Controller
                name="endDate"
                control={control}
                render={({ field }) => <input {...field} type="date" className="input input-bordered w-full" />}
              />
            </div>
          </div>

          {/* Mentions légales et notes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label text-sm mb-1">Mentions légales</label>
              <Controller
                name="legal"
                control={control}
                rules={{ required: false }}
                render={({ field }) => (
                  <textarea {...field} className="textarea textarea-bordered w-full" placeholder="Mentions légales" />
                )}
              />
            </div>
            <div>
              <label className="label text-sm mb-1">Notes internes</label>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <textarea {...field} className="textarea textarea-bordered w-full" placeholder="Notes internes" />
                )}
              />
            </div>
          </div>

          

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={() => reset()}>
              Réinitialiser
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : isEdit ? "Modifier l'ayant droit" : "Créer l'ayant droit"}
            </button>
          </div>
        </form>
      </FormWithAside>

      {/* Confirmation dialog */}
      <ConfirmationDialog
        open={dialogOpen}
        title={isEdit ? "Confirmer la modification" : "Confirmer la création"}
        message={isEdit ? "Voulez-vous confirmer la modification de cet ayant droit ?" : "Voulez-vous confirmer la création de cet ayant droit ?"}
        status={dialogStatus}
        resultMessage={dialogResult}
        onConfirm={confirmSubmit}
        onCancel={closeDialog}
      />
    </div>
  );
}
