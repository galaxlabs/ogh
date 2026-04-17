/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const superusers = app.findCollectionByNameOrId("_superusers")
    const record = new Record(superusers)

    const email = $os.getenv("PB_SUPERUSER_EMAIL") || "admin@openguidehub.local"
    const password = $os.getenv("PB_SUPERUSER_PASSWORD") || "Admin@12345"

    record.set("email", email)
    record.set("password", password)

    app.save(record)
})
