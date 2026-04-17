/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    createRule: "@request.auth.collectionName = 'admins'",
    deleteRule: "@request.auth.collectionName = 'admins'",
    fields: [
      {
        autogeneratePattern: "[a-z0-9]{15}",
        hidden: false,
        id: "text_downloads_id",
        max: 15,
        min: 15,
        name: "id",
        pattern: "^[a-z0-9]+$",
        presentable: false,
        primaryKey: true,
        required: true,
        system: true,
        type: "text"
      },
      {
        hidden: false,
        id: "text_download_title",
        name: "title",
        presentable: true,
        primaryKey: false,
        required: true,
        system: false,
        type: "text",
        autogeneratePattern: "",
        max: 0,
        min: 0,
        pattern: ""
      },
      {
        hidden: false,
        id: "text_download_slug",
        name: "slug",
        presentable: false,
        primaryKey: false,
        required: true,
        system: false,
        type: "text",
        autogeneratePattern: "",
        max: 0,
        min: 0,
        pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$"
      },
      {
        hidden: false,
        id: "text_download_summary",
        name: "summary",
        presentable: false,
        primaryKey: false,
        required: false,
        system: false,
        type: "text",
        autogeneratePattern: "",
        max: 0,
        min: 0,
        pattern: ""
      },
      {
        hidden: false,
        id: "file_download_file",
        name: "file",
        presentable: false,
        primaryKey: false,
        required: false,
        system: false,
        type: "file",
        maxSelect: 1,
        maxSize: 52428800,
        mimeTypes: [],
        thumbs: []
      },
      {
        hidden: false,
        id: "text_download_url",
        name: "externalUrl",
        presentable: false,
        primaryKey: false,
        required: false,
        system: false,
        type: "url",
        exceptDomains: null,
        onlyDomains: null
      },
      {
        hidden: false,
        id: "select_download_status",
        name: "status",
        presentable: false,
        primaryKey: false,
        required: false,
        system: false,
        type: "select",
        maxSelect: 1,
        values: ["draft", "published"]
      },
      {
        hidden: false,
        id: "autodate_download_created",
        name: "created",
        onCreate: true,
        onUpdate: false,
        presentable: false,
        system: false,
        type: "autodate"
      },
      {
        hidden: false,
        id: "autodate_download_updated",
        name: "updated",
        onCreate: true,
        onUpdate: true,
        presentable: false,
        system: false,
        type: "autodate"
      }
    ],
    id: "pbc_7036238488",
    indexes: ["CREATE UNIQUE INDEX idx_downloads_slug ON downloads (slug)"],
    listRule: "status = 'published' || @request.auth.collectionName = 'admins'",
    name: "downloads",
    system: false,
    type: "base",
    updateRule: "@request.auth.collectionName = 'admins'",
    viewRule: "status = 'published' || @request.auth.collectionName = 'admins'"
  });

  try {
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("Collection name must be unique")) {
      console.log("Collection already exists, skipping");
      return;
    }
    throw e;
  }
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("pbc_7036238488");
    return app.delete(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})
