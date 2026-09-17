package com.campus.store;

import com.campus.util.Json;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.function.Supplier;

/**
 * A tiny, generic repository that keeps a list of T in memory and mirrors
 * it to a JSON file on disk after every mutation. Stands in for a real
 * database layer without pulling in any external dependency.
 */
public class FileStore<T> {
    private final Path path;
    private final Function<T, Map<String, Object>> toMap;
    private final Function<Map<String, Object>, T> fromMap;
    private List<T> items;

    public FileStore(Path path,
                      Function<T, Map<String, Object>> toMap,
                      Function<Map<String, Object>, T> fromMap,
                      Supplier<List<T>> seedIfMissing) {
        this.path = path;
        this.toMap = toMap;
        this.fromMap = fromMap;
        load(seedIfMissing);
    }

    @SuppressWarnings("unchecked")
    private void load(Supplier<List<T>> seedIfMissing) {
        if (Files.exists(path)) {
            try {
                String content = Files.readString(path, StandardCharsets.UTF_8);
                Object parsed = content.isBlank() ? new ArrayList<>() : Json.parse(content);
                items = new ArrayList<>();
                if (parsed instanceof List) {
                    for (Object o : (List<Object>) parsed) {
                        items.add(fromMap.apply((Map<String, Object>) o));
                    }
                }
            } catch (IOException e) {
                System.err.println("Failed to read " + path + ": " + e.getMessage());
                items = new ArrayList<>();
            }
        } else {
            items = new ArrayList<>(seedIfMissing.get());
            persist();
        }
    }

    public synchronized List<T> all() {
        return new ArrayList<>(items);
    }

    public synchronized void add(T item) {
        items.add(item);
        persist();
    }

    public synchronized boolean removeById(Function<T, String> idFn, String id) {
        boolean removed = items.removeIf(t -> id.equals(idFn.apply(t)));
        if (removed) persist();
        return removed;
    }

    public synchronized void replaceAll(List<T> newItems) {
        items = new ArrayList<>(newItems);
        persist();
    }

    public synchronized void upsert(java.util.function.Predicate<T> matches, T replacement) {
        int idx = -1;
        for (int i = 0; i < items.size(); i++) {
            if (matches.test(items.get(i))) { idx = i; break; }
        }
        if (idx >= 0) items.set(idx, replacement); else items.add(replacement);
        persist();
    }

    private void persist() {
        try {
            Files.createDirectories(path.getParent());
            List<Object> maps = new ArrayList<>();
            for (T t : items) maps.add(toMap.apply(t));
            Files.writeString(path, Json.write(maps), StandardCharsets.UTF_8);
        } catch (IOException e) {
            System.err.println("Failed to persist " + path + ": " + e.getMessage());
        }
    }
}
