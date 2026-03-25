'use client';

import Header from "@/ui/components/header";
import InputField from "@/ui/components/inputField";
import ConfirmationDialog from "@/ui/components/confirmationDialog";
import { Controller } from "react-hook-form";
import { usePlanForm } from "./usePlanForm";
import FormWithAside from "@/ui/components/formWithAside";
import { useParams } from "next/navigation";

export default function Page() {

  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const {
    control,
    errors,
    isSubmitting,
    dialogOpen,
    dialogStatus,
    dialogResult,
    pendingPlan,

    openConfirm,
    confirmSubmit,
    closeDialog,
    isEdit
  } = usePlanForm(id ?? "new");

  const title = isEdit ? "Modifier un Plan" : "Créer un Plan"; 

  return (
    <>
      <div className="space-y-5">
        <Header
          title={title}
          className="rounded-2xl border border-base-300 px-5 py-3"
        />

       <FormWithAside>
        <form
          onSubmit={openConfirm}
          className="bg-neutral rounded-2xl border border-base-300 p-5 space-y-5"
        >
          {/* Nom / prix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label text-sm mb-1">Nom du plan</label>
              <Controller
                name="name"
                control={control}
                rules={{ required: isEdit ? false : "Nom requis" }}
                render={({ field }) => (
                  <InputField {...field} className="input bg-base-200 border-base-300" />
                )}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
                <label className="label text-sm mb-1">Prix</label>
                <Controller
                  name={`price`}
                  control={control}
                  rules={{ required: isEdit ? false : "Prix requis", min: { value: 0, message: ">= 0" } }}
                  render={({ field }) => (
                    <InputField
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}    
                      className="input bg-base-200 border-base-300"
                    />
                  )}
                />

                {errors.price && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.price?.message}
                </p>
              )}
              </div>

            
          </div>

          {/* Facturation */}
          <div>
            <div className="grid grid-cols-2 gap-3">
              

              <div>
                <label className="label text-sm mb-1">Taux de réduction (%)</label>
                <Controller
                  name={`yearlyDiscount`}
                  control={control}
                  rules={{ required: false, min: { value: 0, message: ">= 0" }, max:{ value: 100, message:"Max 100%"} }}
                  render={({ field }) => (
                    <InputField
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}    
                      className="input bg-base-200 border-base-300"
                    />
                  )}
                />

                {errors.yearlyDiscount && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.yearlyDiscount?.message}
                </p>
              )}
              </div>

              <div>
                <label className="label text-sm mb-1">Devise</label>
                <Controller
                  name="currency"
                  control={control}
                  rules={{required:false}}
                  render={({ field }) => (
                    <select 
                      {...field}
                      onChange={(e) => field.onChange(e.target.value)}
                      
                      className="select bg-base-200 border-base-300 w-full">
                      <option value="XOF">XOF</option>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                    </select>
                  )}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label text-sm mb-1">Appareils</label>
                <Controller
                  name="maxSharedAccounts"
                  control={control}
                  rules={{required: isEdit ? false : "Nombre minimum d'appareil requis", min: { value: 0, message: ">= 0" }, max:{ value: 100, message:"Max 100%"}}}
                  render={({ field }) => (
                    <InputField
                      type="number"
                      {...field}
                      
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      
                      className="input bg-base-200 border-base-300"
                    />
                  )}
                />
              </div>
              <div>
              <label className="label text-sm mb-1">Qualité max</label>
              <Controller
                name="quality"
                control={control}
                render={({ field }) => (
                  <select 
                    {...field}
                    onChange={(e) => field.onChange(e.target.value)} 
                    className="select bg-base-200 border-base-300 w-full">
                    <option value="SD">SD</option>
                    <option value="HD">HD</option>
                    <option value="Full HD">Full HD</option>
                    <option value="4K">4K</option>
                  </select>
                )}
              />
            </div>
            </div>
          </div>

          {/* Qualité / description */}
          <div className="grid grid-cols-1 gap-4">
            

            <div>
              <label className="label text-sm mb-1">Description</label>
              <Controller
                name="description"
                control={control}
                rules={{required:false}}
                render={({ field }) => (
                  <textarea
                    
                    {...field}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="textarea bg-base-200 border-base-300 w-full min-h-[100px]"
                  />
                )}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="btn btn-primary rounded-full px-6"
              disabled={isSubmitting}
            >
              {isEdit ? "Mettre ầ jour" :  "Créer le plan"}
            </button>

            <a
              href="/dashboard/subscriptions"
              className="btn btn-ghost rounded-full border-base-300"
            >
              Annuler
            </a>
          </div>
        </form>
       </FormWithAside> 
      </div>

      {/* Confirmation */}
      <ConfirmationDialog
        open={dialogOpen}
        title="Confirmer la création du plan"
        message="Vérifiez les informations avant de les envoyer au serveur."
        status={dialogStatus}
        resultMessage={dialogResult}
        confirmLabel="Envoyer"
        onCancel={closeDialog}
        onConfirm={confirmSubmit}
      >
        {pendingPlan && (
          <div className="bg-base-100/10 border border-base-300 rounded-xl p-3 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-white/60">Nom</span>
              <span>{pendingPlan.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Tarif</span>
              <span>{pendingPlan.price} {pendingPlan.currency ?? "XOF"}</span>
            </div>
            
            
            <div className="flex justify-between">
              <span className="text-white/60">Appareils</span>
              <span>{pendingPlan.maxSharedAccounts}</span>
            </div>

            <p>{`L'abonnement annuel s'élèvera à ${Math.round(pendingPlan.price * 12 * (1 - pendingPlan.yearlyDiscount / 100))} ${pendingPlan.currency ?? "XOF"}`}</p>
          </div>
        )}
      </ConfirmationDialog>
    </>
  );
}
