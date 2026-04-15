"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface TopToolbarProps {
    onDownload?: () => void;
    onSave?: () => void;
    onShare?: () => void;
    isSaving?: boolean;
    isSaveEnabled?: boolean;
    isShareEnabled?: boolean;
}

const TopToolbar = ({ onSave, onShare, isSaving, isSaveEnabled, isShareEnabled, onDownload }: TopToolbarProps) => {
    const t = useTranslations("edit");
    return (
        <div className="fixed top-14 h-14 main-actions mt-3 right-0 px-4 z-10 flex items-center gap-2">
            { onDownload && (
                <Button
                    onClick={onDownload}
                >
                   {t("save")}
                </Button>
            ) }
            { onSave && (
                <Button
                    onClick={onSave}
                    disabled={isSaveEnabled === false || isSaving}
                    isLoading={isSaving}
                >
                    {t("saveToServer")}
                </Button>
            ) }
            {onShare && (
                <Button
                    variant="outline"
                    onClick={onShare}
                    disabled={isShareEnabled === false}
                >
                    {t("share")}
                </Button>
            )}
        </div>
    );
}

export default TopToolbar;
