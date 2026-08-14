import type { SelectionToolbarCustomAction } from "@/types/config/selection-toolbar"
import { IconExternalLink, IconTrash } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { useSelector } from "@tanstack/react-store"
import { useCallback } from "react"
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/base-ui/alert"
import { Button } from "@/components/ui/base-ui/button"
import { Field, FieldTitle } from "@/components/ui/base-ui/field"
import { getLocalNotebaseDetailUrl } from "@/utils/constants/local-notebase"
import { i18n } from "@/utils/i18n"
import { getLocalNotebaseRepository } from "@/utils/local-notebase/repository"
import { withForm } from "./form"

function t(key: string) {
  return i18n.t(`options.selectionToolbar.customActions.form.notebase.${key}` as never)
}

export const NotebaseConnectionField = withForm({
  ...{ defaultValues: {} as SelectionToolbarCustomAction },
  render: function Render({ form }) {
    const action = useSelector(form.store, (state) => state.values)
    const localNotebaseId = action.localNotebaseId

    const notebaseQuery = useQuery({
      queryKey: ["local-notebase", localNotebaseId],
      queryFn: async () => {
        if (!localNotebaseId) {
          return null
        }
        const repository = await getLocalNotebaseRepository()
        return repository.getNotebase(localNotebaseId)
      },
      enabled: !!localNotebaseId,
      staleTime: 60_000,
      meta: {
        suppressToast: true,
      },
    })

    const handleDisconnect = useCallback(() => {
      form.setFieldValue("localNotebaseId", undefined)
      void form.handleSubmit()
    }, [form])

    return (
      <Field className="gap-4 rounded-xl border border-dashed bg-muted/10 p-4">
        <div className="space-y-1">
          <FieldTitle>{t("title")}</FieldTitle>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>

        {!localNotebaseId ? (
          <Alert>
            <AlertTitle>{t("notConnectedTitle")}</AlertTitle>
            <AlertDescription>{t("notConnectedDescription")}</AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <AlertTitle>{t("connectedTitle")}</AlertTitle>
            <AlertDescription>{notebaseQuery.data?.name ?? t("connectedLoading")}</AlertDescription>
            <AlertAction>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  render={
                    <a
                      href={getLocalNotebaseDetailUrl(localNotebaseId)}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  <IconExternalLink />
                  {t("openNotebaseAction")}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleDisconnect}>
                  <IconTrash />
                  {t("clearConnectionAction")}
                </Button>
              </div>
            </AlertAction>
          </Alert>
        )}
      </Field>
    )
  },
})
