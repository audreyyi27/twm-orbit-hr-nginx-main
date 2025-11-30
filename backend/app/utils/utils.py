def normalize_empty_strings(d: dict, model_cls) -> dict:
    fields = model_cls.model_fields.keys()
    return {
        f: (None if d.get(f) == "" else d.get(f, None))
        for f in fields
    }