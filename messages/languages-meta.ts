type LocaleMetaConfig = {
    fileName: string,
    isRtl?: boolean,
    countryCode: string
}
type LanguagesMetaType = LocaleMetaConfig[];

const data: LanguagesMetaType = [
    {
        "countryCode": "GB",
        "fileName": "en",
    },
    {
        "countryCode": "FR",
        "fileName": "fr",
    },
    {
        "countryCode": "ES",
        "fileName": "es"
    },
    {
        "countryCode": "DE",
        "fileName": "de"
    },
    {
        "countryCode": "IT",
        "fileName": "it"
    },
    {
        "countryCode": "PT",
        "fileName": "pt"
    },
    {
        "countryCode": "SA",
        "fileName": "ar",
        "isRtl": true
    },
    {
        "countryCode": "CN",
        "fileName": "zh"
    }
]
export default data;