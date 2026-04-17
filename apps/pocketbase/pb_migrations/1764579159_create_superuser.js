/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const superusers = app.findCollectionByNameOrId("_superusers")
    const email = $os.getenv("PB_SUPERUSER_EMAIL")
    const password = $os.getenv("PB_SUPERUSER_PASSWORD")

    if (!email || !password) {
        console.log("PocketBase superuser env vars not set, skipping automatic superuser creation")
        return
    }

    const record = new Record(superusers)
    record.set("email", email)
    record.set("password", password)

    app.save(record)
})
