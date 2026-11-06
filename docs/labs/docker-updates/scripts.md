---
title: Scripts
description: The six scripts and the configuration files of the Docker update setup, in full, with what each one is for.
---

# Scripts

Copy these files into your repository, at the paths in their titles. Each block opens with a click, and the button at its top right copies the whole file.

The six scripts are general: they read the names of your servers from the stack maps, and they hold no names of their own. Each one explains itself at the top of the file. They need Python 3.9 or later and bash, and nothing else.

## The scripts

### split_stacks.py

Splits the large compose file into one folder per stack, moves secret values into variables, and writes the secrets file. It also removes a moved stack from the large file and prints the Environment text of a Komodo Stack.

- When: in [Move the stacks](move-stacks.md), once for each stack, and later when a key becomes secret.
- Reads: `tools/stacks/<server>.json` and `tools/pins/<server>.json` (examples below).
- Example: `python3 -I tools/split_stacks.py --server server-a --compose /home/docker-compose.yml --out server-a --secrets-file /root/secrets-server-a.env`
- Output: `N stack files written, M already migrated and kept`. Messages never hold a secret value.
- Exit codes: 0 done, 1 error, 2 wrong arguments.

??? example "tools/split_stacks.py"

    ```python
    #!/usr/bin/env python3
    """Split one large compose file into one compose file per stack.

    Many homelabs start with one big docker-compose.yml that holds every
    service, live ones next to commented-out ones. This tool reads that file
    and writes one folder per stack, each with its own docker-compose.yml, so
    that a tool such as Komodo can deploy each stack on its own from Git.

    It runs on the server that owns the compose file, so the real values stay
    on that server. It reads the file line by line and by indentation, not with
    a YAML library, so the stack files keep the formatting and the comments of
    the original. Commented-out services stay out of the stack files.

    Files
    -----
    tools/stacks/SERVER.json   The stack map of one server (required).
    tools/pins/SERVER.json     The exact image of each service (split only).

    SERVER is the value of --server. It may hold letters, digits, - and _, and
    it must start with a letter or a digit. Any server with a map file works.

    The stack map, for example tools/stacks/server-a.json:

        {
          "stacks": {"proxy": ["swag"], "media": ["sonarr", "sonarr-db"]},
          "skip": ["komodo-core", "komodo-mongo", "komodo-periphery"],
          "secret_keys": ["DB_PASSWORD", "API_TOKEN"],
          "secret_flags": ["--requirepass"],
          "scan_exempt_keys": ["POSTGRES_USER"],
          "plain_env": {"TZ": "Etc/UTC", "PUID": "1000", "PGID": "1000"},
          "network": {"key": "lab.docker", "name": "home_lab.docker"}
        }

      stacks            Stack name -> its services. Each live service of the
                        compose file must be in exactly one stack or in skip.
                        A service that needs another one (depends_on, links)
                        must be in the same stack.
      skip              Services that stay out of every stack, for example
                        Komodo itself.
      secret_keys       Environment keys whose values are secrets. Each value
                        moves to a variable such as ${SONARR_DB_PASSWORD}, and
                        the real value goes to the secrets file.
      secret_flags      Command-line flags whose values are secrets, for
                        example redis-server --requirepass.
      scan_exempt_keys  Secret keys whose values also appear as normal text,
                        such as a database user named like its service. The
                        leak scan skips them.
      plain_env         Values that are not secret but that the stack files
                        use as variables. --print-env writes them in clear.
      network           The external Docker network that the services join:
                        "key" is the name under networks: in the services, and
                        "name" is the real network name. A map without it
                        works only if no service uses a network.

    The pins, for example tools/pins/server-a.json, give each service its
    exact image, with tag and digest:

        {"sonarr": "lscr.io/linuxserver/sonarr:4.0.15@sha256:<64 hex digits>"}

    Modes
    -----
    Split the compose file into stack folders under OUT, and write the secrets
    to the secrets file:

        split_stacks.py --server server-a --compose /home/docker-compose.yml         --out server-a --secrets-file /root/secrets-server-a.env

        It prints "N stack files written, M already migrated and kept". A stack
        whose services are no longer in the compose file is kept as it is. If
        a key became secret after the move, its value moves to a variable in the
        kept file too, and the line ends with ", K of them with new secrets".
        A run on the same input writes the same files.

    Print the compose file without one stack, after that stack runs from its
    own folder:

        split_stacks.py --server server-a --compose /home/docker-compose.yml         --remove media > /home/docker-compose.yml.new

    Print the compose file without the services in the map's skip list:

        split_stacks.py --server server-a --compose /home/docker-compose.yml         --remove skip > /home/docker-compose.yml.new

    Print the Environment text for a Komodo Stack, from a stack file written
    before. Plain values are written as NAME=value, and secrets as
    NAME='[[NAME]]', which Komodo fills from a secret Variable of that name:

        split_stacks.py --server server-a --compose /home/docker-compose.yml         --out server-a --secrets-file /root/secrets-server-a.env         --print-env media

    Exit codes: 0 done, 1 error (the message starts with "error:"), 2 wrong
    arguments.

    Safety
    ------
    - No message ever holds a secret value, because the output gets shared.
      Messages name the service, the key or the variable instead.
    - The secrets file holds NAME='value' lines and is created with mode 0600.
      Keep it on the server, out of Git, and delete it after the values are
      stored in Komodo.
    - After the split, the tool searches the output folder for every secret
      value. If it finds one, it stops with an error, and the output must not
      be committed.
    - A commented-out line that names a secret key or flag is dropped, because
      it may hold an old value that no scan would catch.
    - A volume or env_file with a relative path is an error, because the path
      would point somewhere else from the stack's own folder.
    """
    import argparse
    import json
    import os
    import re
    import sys
    import tempfile

    TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
    STACK_FILE = "docker-compose.yml"


    class SplitError(Exception):
        pass


    def _indent(line):
        return len(line) - len(line.lstrip(" "))


    def _is_comment(line):
        return line.lstrip().startswith("#")


    def _is_live(line):
        return bool(line.strip()) and not _is_comment(line)


    def _service_spans(lines):
        """Return the base indent and {service: [first line, end line]}.

        A span stops at the service's last line, so commented-out services
        between two live ones belong to neither.
        """
        start = next(
            (i for i, line in enumerate(lines) if re.match(r"services:\s*(#.*)?$", line)),
            None,
        )
        if start is None:
            raise SplitError("no top-level services: key found")

        base = None
        spans = {}
        current = None
        for i in range(start + 1, len(lines)):
            line = lines[i]
            if not line.strip():
                continue
            indent = _indent(line)
            if _is_comment(line):
                if current is not None and base is not None and indent > base:
                    current[1] = i + 1
                continue
            if indent == 0:
                break
            if base is None:
                base = indent
            if indent == base:
                match = re.match(r"([A-Za-z0-9._-]+):\s*(#.*)?$", line.strip())
                if match is None:
                    raise SplitError(f"line {i + 1}: expected a service name")
                current = spans[match.group(1)] = [i, i + 1]
            elif indent > base and current is not None:
                current[1] = i + 1
            else:
                raise SplitError(f"line {i + 1}: unexpected indentation")
        return base, spans


    def parse_services(text):
        """Return {service: its lines, without the service's own name line}."""
        lines = text.split("\n")
        base, spans = _service_spans(lines)
        services = {}
        for name, (first, end) in spans.items():
            services[name] = [
                line
                for line in lines[first + 1:end]
                if not (_is_comment(line) and _indent(line) <= base)
            ]
        return services


    def _child_indent(lines):
        live = [line for line in lines if _is_live(line)]
        return _indent(live[0]) if live else 0


    def _section(lines, key):
        """Return (text after "key:", live lines nested under it), or None."""
        live = [line for line in lines if _is_live(line)]
        child = _child_indent(lines)
        for i, line in enumerate(live):
            if _indent(line) == child and line.strip().startswith(key + ":"):
                nested = []
                for follow in live[i + 1:]:
                    is_list_item = follow.strip().startswith("- ")
                    if _indent(follow) > child or (_indent(follow) == child and is_list_item):
                        nested.append(follow)
                    else:
                        break
                return line.strip()[len(key) + 1:].strip(), nested
        return None


    def _names(lines, key):
        """Return the names under a key, in list, mapping or [flow] form."""
        section = _section(lines, key)
        if section is None:
            return []
        inline, nested = section
        if inline.startswith("["):
            return re.findall(r"[\w.-]+", inline.split("#")[0])
        if not nested:
            return []
        depth = min(_indent(line) for line in nested)
        names = []
        for line in nested:
            if _indent(line) == depth:
                match = re.match(r"(?:-\s+)?[\"']?([\w.-]+)", line.strip())
                if match:
                    names.append(match.group(1))
        return names


    def validate_map(services, stack_map):
        skip = set(stack_map.get("skip", []))
        owner = {}
        for stack, names in stack_map["stacks"].items():
            for name in names:
                if name in owner or name in skip:
                    raise SplitError(f"service {name} is listed more than once in the map")
                owner[name] = stack

        for name, lines in services.items():
            if name in skip:
                continue
            if name not in owner:
                raise SplitError(f"service {name} is not in any stack")
            for key in ("depends_on", "links"):
                for other in _names(lines, key):
                    if owner.get(other) != owner[name]:
                        raise SplitError(
                            f"{name} (stack {owner[name]}) needs {other} "
                            f"(stack {owner.get(other, 'none')}) through {key}"
                        )


    def pin_image(lines, ref):
        child = _child_indent(lines)
        pinned = []
        found = False
        for line in lines:
            if _is_live(line) and _indent(line) == child and line.strip().startswith("image:"):
                pinned.append(" " * child + "image: " + ref)
                found = True
            else:
                pinned.append(line)
        if not found:
            raise SplitError("service has no live image: line")
        return pinned


    def _scalar(raw, where):
        """Return the string that a one-line YAML scalar holds.

        Handles plain, 'single-quoted' and "double-quoted" values and strips a
        trailing # comment. Anything this parser cannot read with certainty,
        such as a multi-line value, is an error instead of a guess.
        """
        raw = raw.strip()
        if raw[:1] == '"':
            match = re.match(r'"(?:[^"\\]|\\.)*"', raw)
            if match is None:
                raise SplitError(f"{where}: unclosed double quote")
            try:
                value = json.loads(match.group(0))
            except ValueError:
                raise SplitError(f"{where}: unsupported escape sequence") from None
        elif raw[:1] == "'":
            match = re.match(r"'(?:[^']|'')*'", raw)
            if match is None:
                raise SplitError(f"{where}: unclosed single quote")
            value = match.group(0)[1:-1].replace("''", "'")
        elif raw[:1] in ("|", ">"):
            raise SplitError(f"{where}: multi-line values are not supported")
        else:
            return re.split(r"(?:^|\s+)#", raw, maxsplit=1)[0]

        rest = raw[match.end():].strip()
        if rest and not rest.startswith("#"):
            raise SplitError(f"{where}: unexpected text after the closing quote")
        return value


    def _compose_value(value, where):
        """Undo compose escaping. Return None if there is nothing to extract.

        In a compose file, $$ is a literal $. An empty value or one that is
        already a ${VARIABLE} needs no work. A value that mixes text with a
        variable cannot move to an env file as one value, so it is an error.
        """
        if not value or re.fullmatch(r"\$\{[^}]*\}", value):
            return None
        if "$" in value.replace("$$", ""):
            raise SplitError(f"{where}: value mixes text with a variable or a bare $")
        if "\n" in value:
            raise SplitError(f"{where}: multi-line values are not supported")
        if value.endswith("\\") or "\\'" in value:
            raise SplitError(f"{where}: Compose cannot read this backslash from an env file")
        return value.replace("$$", "$")


    def _variable(service, key):
        """Name the variable for a secret: service web, key DB_PASSWORD -> WEB_DB_PASSWORD."""
        return re.sub(r"[^A-Za-z0-9]", "_", f"{service}_{key}").upper()


    def _extract_flag(service, line, flag, found):
        """Move the value after a flag on a plain command: line to a variable."""
        where = f"{service} {flag}"
        match = re.match(
            rf"(\s*command:\s+[^\s\"'\[].*?{re.escape(flag)}[ =])(\S+)(.*)$", line
        )
        if match is None:
            raise SplitError(f"{where}: only a plain command: line is supported")
        token = match.group(2)
        if re.fullmatch(r'"\$\{[^}]*\}"', token):
            return line
        if re.search(r"[\"'\\]", token):
            raise SplitError(f"{where}: value has a quote or a backslash")
        value = _compose_value(token, where)
        if value is None:
            return line
        variable = _variable(service, flag.lstrip("-"))
        found[variable] = value
        return f'{match.group(1)}"${{{variable}}}"{match.group(3)}'


    def extract_secrets(service, lines, keys, flags=()):
        """Replace secret values with variables.

        Returns the new lines and {variable: real value}. A commented-out
        line that names a secret key or flag is dropped, because it may hold
        an old value and no scan would catch that.
        """
        result = []
        found = {}
        for line in lines:
            if _is_comment(line):
                match = re.match(r"\s*#+\s*(?:-\s*)?[\"']?([\w.-]+)[\"']?\s*[:=]", line)
                named = match and match.group(1) in keys
                if not named and not any(flag in line for flag in flags):
                    result.append(line)
                continue

            for flag in flags:
                if flag in line:
                    line = _extract_flag(service, line, flag, found)

            mapping = re.match(r"(\s*)([\"']?)([\w.-]+)\2:(?:\s+(.*))?$", line)
            listed = re.match(r"(\s*-\s+)([\"']?)([\w.-]+)=", line)
            if mapping and mapping.group(3) in keys:
                key = mapping.group(3)
                where = f"{service} {key}"
                value = _compose_value(_scalar(mapping.group(4) or "", where), where)
                if value is not None:
                    variable = _variable(service, key)
                    found[variable] = value
                    line = f'{mapping.group(1)}{key}: "${{{variable}}}"'
            elif listed and listed.group(3) in keys:
                key = listed.group(3)
                where = f"{service} {key}"
                item = _scalar(line[listed.end(1):], where)
                value = _compose_value(item.split("=", 1)[1], where)
                if value is not None:
                    variable = _variable(service, key)
                    found[variable] = value
                    line = f"{listed.group(1)}{key}=${{{variable}}}"
            result.append(line)
        return result, found


    def render_stack(stack, blocks, network):
        """Return the text of one stack file.

        network is the map's {"key": ..., "name": ...}, or None. The key is the
        name that the services use under networks:, and the name is the real
        Docker network, which already exists, so the stack declares it external.
        """
        out = [f"name: {stack}", "services:"]
        uses_network = False
        for i, (name, lines) in enumerate(blocks.items()):
            if i:
                out.append("")
            out.append(f"  {name}:")
            out.extend(lines)
            for used in _names(lines, "networks"):
                if network is None:
                    raise SplitError(f"map has no network, but {name} uses {used}")
                if used != network["key"]:
                    raise SplitError(f"{name} uses unknown network {used}")
                uses_network = True
        if uses_network:
            out += ["", "networks:", f"  {network['key']}:", "    external: true", f"    name: {network['name']}"]
        return "\n".join(out) + "\n"


    def remove_services(text, names):
        lines = text.split("\n")
        _, spans = _service_spans(lines)
        dropped = set()
        for name in names:
            if name not in spans:
                raise SplitError(f"service {name} is not in the compose file")
            dropped.update(range(*spans[name]))
        return "\n".join(line for i, line in enumerate(lines) if i not in dropped)


    def scan_for_values(root, values):
        """Return the files under root that contain any of the values."""
        wanted = [value for value in values if value]
        hits = []
        for folder, dirs, files in os.walk(root):
            dirs.sort()
            for name in sorted(files):
                path = os.path.join(folder, name)
                with open(path, encoding="utf-8", errors="ignore") as f:
                    text = f.read()
                if any(value in text for value in wanted):
                    hits.append(path)
        return hits


    def _check_paths(service, lines):
        """Relative paths would point somewhere new from the stack's folder."""
        for key in ("volumes", "env_file"):
            section = _section(lines, key)
            if section is None:
                continue
            for entry in [section[0], *section[1]]:
                path = re.sub(r"^\s*(?:-\s+)?[\"']?", "", entry)
                if path.startswith(("./", "../", "~")):
                    raise SplitError(f"{service} has a relative path under {key}")


    def _read_secrets(path):
        if not os.path.exists(path):
            return {}
        with open(path, encoding="utf-8") as f:
            text = f.read()
        secrets = {}
        for line in text.split("\n"):
            if line:
                name, _, quoted = line.partition("=")
                secrets[name] = quoted[1:-1].replace("\\'", "'")
        return secrets


    def _write_secrets(path, secrets):
        # Compose reads \' inside single quotes. Shell-style '\'' fails.
        body = "".join(
            "{}='{}'\n".format(name, secrets[name].replace("'", "\\'"))
            for name in sorted(secrets)
        )
        # mkstemp creates the file as 0600.
        fd, temp = tempfile.mkstemp(dir=os.path.dirname(os.path.abspath(path)))
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as f:
            f.write(body)
        os.replace(temp, path)


    def _existing_services(stack, path, names, present):
        """Return the services in a moved stack's file, so others can join it.

        The file and the compose file together must hold each service of the
        stack exactly once.
        """
        existing = {}
        if os.path.exists(path):
            with open(path, encoding="utf-8") as f:
                existing = parse_services(f.read())
        for name in existing:
            if name not in names:
                raise SplitError(f"stack {stack} file holds {name}, which the map does not list for it")
            if name in present:
                raise SplitError(f"stack {stack} already holds {name}, which is also in the compose file")
        missing = [name for name in names if name not in present and name not in existing]
        if missing:
            raise SplitError(f"stack {stack} is only partly in the compose file: {', '.join(missing)} missing")
        return existing


    def _extract_in_file(text, keys, flags):
        """Apply extract_secrets to each service in a moved stack's file.

        A key that became secret after the move gets its variable here. Other
        lines stay as they are, so a change by Renovate survives.
        """
        lines = text.split("\n")
        _, spans = _service_spans(lines)
        found = {}
        # From the end, so that a shorter service does not move the next span.
        for name, (first, end) in sorted(spans.items(), key=lambda item: -item[1][0]):
            lines[first + 1:end], more = extract_secrets(name, lines[first + 1:end], keys, flags)
            found.update(more)
        return "\n".join(lines), found


    def split_compose(text, stack_map, pins, out_dir, secrets_file):
        """Write the stack files and secrets file.

        Return (written, kept, updated): updated counts the kept stacks whose
        file changed because a key became secret after the move.
        """
        services = parse_services(text)
        validate_map(services, stack_map)

        secrets = _read_secrets(secrets_file)
        keys = stack_map.get("secret_keys", [])
        flags = stack_map.get("secret_flags", [])
        rendered = {}
        kept = []
        updated = 0
        for stack, names in stack_map["stacks"].items():
            path = os.path.join(out_dir, stack, STACK_FILE)
            present = [name for name in names if name in services]
            if not present:
                if not os.path.exists(path):
                    raise SplitError(f"stack {stack} has no services and no existing file")
                kept.append(stack)
                with open(path, encoding="utf-8") as f:
                    old = f.read()
                new, found = _extract_in_file(old, keys, flags)
                secrets.update(found)
                if new != old:
                    rendered[path] = new
                    updated += 1
                continue
            existing = {}
            if len(present) != len(names):
                existing = _existing_services(stack, path, names, present)

            blocks = {}
            for name in names:
                if name in existing:
                    blocks[name], found = extract_secrets(name, existing[name], keys, flags)
                    secrets.update(found)
                    continue
                if name not in pins:
                    raise SplitError(f"no pin for service {name}")
                _check_paths(name, services[name])
                try:
                    lines = pin_image(services[name], pins[name])
                except SplitError as error:
                    raise SplitError(f"{name}: {error}") from None
                blocks[name], found = extract_secrets(name, lines, keys, flags)
                secrets.update(found)
            rendered[path] = render_stack(stack, blocks, stack_map.get("network"))

        for path, body in rendered.items():
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "w", encoding="utf-8", newline="\n") as f:
                f.write(body)
        _write_secrets(secrets_file, secrets)

        # Some secrets, such as a database username, match a service name or
        # a path, so the scan cannot tell a leak from a normal line.
        exempt = {
            _variable(service, key)
            for names in stack_map["stacks"].values()
            for service in names
            for key in stack_map.get("scan_exempt_keys", [])
        }
        leaks = {}
        for name, value in secrets.items():
            hits = [] if name in exempt else scan_for_values(out_dir, [value])
            if hits:
                leaks[name] = hits
        if leaks:
            detail = "; ".join(f"{name} in {', '.join(hits)}" for name, hits in sorted(leaks.items()))
            raise SplitError(f"secret values found in the output, do not commit it: {detail}")
        return len(rendered) - updated, len(kept), updated


    def stack_environment(text, plain, secret_names):
        """Return the text for a Komodo Stack's Environment field.

        Single quotes make Compose read a secret literally, so a $ stays a $.
        """
        live = "\n".join(line for line in text.split("\n") if _is_live(line))
        names = sorted(set(re.findall(r"\$\{([A-Za-z0-9_]+)\}", live)))
        unknown = [name for name in names if name not in plain and name not in secret_names]
        if unknown:
            raise SplitError(f"variable {unknown[0]} is not plain or a secret")
        lines = [f"{name}={plain[name]}" for name in names if name in plain]
        lines += [f"{name}='[[{name}]]'" for name in names if name not in plain]
        return "".join(line + "\n" for line in lines)


    def _load_json(path):
        with open(path, encoding="utf-8") as f:
            return json.load(f)


    def server_name(value):
        """argparse type for --server: a plain name, so the map path stays in tools/stacks."""
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]*", value):
            raise argparse.ArgumentTypeError(
                f"server name must start with a letter or digit and hold only letters, digits, - and _: {value!r}"
            )
        return value


    def main(argv=None, tools_dir=TOOLS_DIR):
        parser = argparse.ArgumentParser(
            description="Split one large compose file into one compose file per stack. "
            "Read the top of this file for the map format and examples."
        )
        parser.add_argument(
            "--server",
            required=True,
            type=server_name,
            help="the server whose map tools/stacks/SERVER.json and pins tools/pins/SERVER.json are used",
        )
        parser.add_argument("--compose", required=True, help="the large compose file to read")
        parser.add_argument("--out", help="folder for the stack folders, usually the server's folder in the repository")
        parser.add_argument("--secrets-file", help="file for the secret values, kept on the server and out of Git")
        parser.add_argument(
            "--remove",
            metavar="STACK",
            help="print the compose file without STACK, or without the map's skip list for 'skip'",
        )
        parser.add_argument(
            "--print-env",
            metavar="STACK",
            help="print the Komodo Environment text for a generated stack",
        )
        args = parser.parse_args(argv)
        if not args.remove and not (args.out and args.secrets_file):
            parser.error("--out and --secrets-file are required unless --remove is given")

        try:
            with open(args.compose, encoding="utf-8") as f:
                text = f.read()
            map_path = os.path.join(tools_dir, "stacks", f"{args.server}.json")
            if not os.path.exists(map_path):
                raise SplitError(f"no stack map tools/stacks/{args.server}.json")
            stack_map = _load_json(map_path)
            if args.remove == "skip":
                sys.stdout.write(remove_services(text, stack_map["skip"]))
            elif args.remove:
                if args.remove not in stack_map["stacks"]:
                    raise SplitError(f"stack {args.remove} is not in the map")
                # Services that already joined a moved stack are gone from the file.
                services = parse_services(text)
                present = [name for name in stack_map["stacks"][args.remove] if name in services]
                if not present:
                    raise SplitError(f"stack {args.remove} has no services in the compose file")
                sys.stdout.write(remove_services(text, present))
            elif args.print_env:
                with open(os.path.join(args.out, args.print_env, STACK_FILE), encoding="utf-8") as f:
                    stack_text = f.read()
                sys.stdout.write(
                    stack_environment(
                        stack_text, stack_map.get("plain_env", {}), _read_secrets(args.secrets_file)
                    )
                )
            else:
                pins = _load_json(os.path.join(tools_dir, "pins", f"{args.server}.json"))
                written, kept, updated = split_compose(text, stack_map, pins, args.out, args.secrets_file)
                note = f", {updated} of them with new secrets" if updated else ""
                print(f"{written} stack files written, {kept} already migrated and kept{note}")
        except (SplitError, OSError, ValueError) as error:
            print(f"error: {error}", file=sys.stderr)
            return 1
        return 0


    if __name__ == "__main__":
        sys.exit(main())
    ```

### check_images.py

Compares the image of each container on a server with the image in its stack files and its `komodo_files`, and lists containers that no file describes. It only reads.

- When: after each merge for a critical stack, after a reboot, and whenever you want proof. See [Daily use](daily-use.md#find-an-update-that-did-not-deploy).
- Example: `python3 -I tools/check_images.py server-a`
- Output: only the problems (`DIFFERENT`, `MISSING`, `NOT RUNNING`, `NOT IN ANY FILE`), then `N of M containers run the image from the repo`.
- Exit codes: 0 all match, 1 a problem, 2 wrong arguments or no stack map.

??? example "tools/check_images.py"

    ```python
    #!/usr/bin/env python3
    """Compare the image that each container runs with the image that the repo
    asks for, on one server.

    Why
    ---
    With a GitOps setup, the stack files in Git say which image each service
    runs. Most stacks deploy by themselves after a merge, but some (a reverse
    proxy, the Git server itself) wait for a click on Deploy. If you forget the
    click, the server keeps running the old image, and nothing tells you. This
    tool finds that, and it also finds containers that are stopped, missing,
    or not described by any file.

    It only reads. It runs `docker inspect` and `docker ps`, prints container
    names and image references, and changes nothing.

    Usage
    -----
    Run it on the server, in its clone of the repository, after a pull:

        cd /root/<your-repo> && git pull && python3 -I tools/check_images.py server-a

    SERVER is the name of a folder in the repository root that holds one
    folder per stack (server-a/<stack>/docker-compose.yml), and of its stack
    map tools/stacks/SERVER.json. Containers that run outside those stacks,
    such as Komodo itself, are listed in the map:

        "komodo_files": ["komodo/docker-compose.yml"]

    Paths in komodo_files are relative to the repository root. A map without
    komodo_files checks only the stack folders.

    How it matches
    --------------
    A service matches the container with its container_name, or, without one,
    the container with the service's name. Docker shows images from Docker Hub
    with docker.io/ or docker.io/library/ in front, so those prefixes do not
    count as a difference.

    Output
    ------
    Only problems are printed, then a summary:

        DIFFERENT: <stack>/<container>       The container runs another image.
          repo:    <image in the file>       Click Deploy on that stack.
          running: <image it runs>
        MISSING: <stack>/<container>         No such container. Read the log
                                             of the stack's last deploy.
        NOT RUNNING: <stack>/<container>     It exists but is stopped, exited
                                             or restarting. Read its log.
        N of M containers run the image from the repo
        NOT IN ANY FILE: <container>         A container that no file
                                             describes. Find out who started it.

    When all is well, the only line is "M of M containers run the image from
    the repo".

    Exit codes: 0 all match and no extra container, 1 a problem was found,
    2 wrong arguments or no stack map for the server.
    """
    import glob
    import json
    import os
    import re
    import subprocess
    import sys

    REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    SERVER_NAME = re.compile(r"[A-Za-z0-9][A-Za-z0-9_-]*")


    class UsageError(Exception):
        pass


    def services(path):
        """Yield (stack, service, container_name, image) from one compose file.

        It reads by line and indentation: services at two spaces, their keys at
        four. Commented-out lines are ignored. The stack is the name of the
        folder that holds the file.
        """
        with open(path, encoding="utf-8") as f:
            lines = f.read().replace("\r\n", "\n").split("\n")
        stack = os.path.basename(os.path.dirname(path))
        in_services = False
        current = None
        found = {}
        for line in lines:
            if re.match(r"^services:\s*$", line):
                in_services = True
                continue
            if re.match(r"^\S", line):
                in_services = False
                current = None
                continue
            if not in_services or re.match(r"^\s*#", line):
                continue
            name = re.match(r"^  ([A-Za-z0-9_.-]+):\s*$", line)
            if name:
                current = name.group(1)
                found[current] = {"container": current, "image": None}
                continue
            if current is None:
                continue
            image = re.match(r"^    image:\s*['\"]?([^'\"\s#]+)", line)
            if image:
                found[current]["image"] = image.group(1)
            container = re.match(r"^    container_name:\s*['\"]?([^'\"\s#]+)", line)
            if container:
                found[current]["container"] = container.group(1)
        for service, item in found.items():
            yield stack, service, item["container"], item["image"]


    def normalize(ref):
        """docker.io/library/ and docker.io/ are what Docker adds by itself."""
        ref = ref or ""
        for prefix in ("docker.io/library/", "docker.io/"):
            if ref.startswith(prefix):
                ref = ref[len(prefix):]
        return ref


    def komodo_files(server, root):
        """Return the absolute paths of the map's komodo_files, or []."""
        path = os.path.join(root, "tools", "stacks", f"{server}.json")
        if not os.path.exists(path):
            raise UsageError(f"no stack map tools/stacks/{server}.json")
        with open(path, encoding="utf-8") as f:
            stack_map = json.load(f)
        return [os.path.join(root, item) for item in stack_map.get("komodo_files", [])]


    def docker_inspect(name):
        """Return (image, state) of one container, or None if it does not exist."""
        result = subprocess.run(
            ["docker", "inspect", "--format", "{{.Config.Image}} {{.State.Status}}", name],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            return None
        image, _, state = result.stdout.strip().partition(" ")
        return image, state


    def docker_names():
        """Return the names of all containers, running or not."""
        result = subprocess.run(["docker", "ps", "-a", "--format", "{{.Names}}"], capture_output=True, text=True)
        return result.stdout.split()


    def check(server, root, inspect, names):
        """Print the problems and the summary. Return the exit code.

        inspect and names stand in for Docker, so tests can pass fakes.
        """
        files = sorted(glob.glob(os.path.join(root, server, "*", "docker-compose.yml")))
        files += komodo_files(server, root)
        expected = set()
        rows = []
        for path in files:
            for stack, _service, container, image in services(path):
                expected.add(container)
                found = inspect(container)
                if found is None:
                    rows.append(("MISSING", stack, container, image, "-"))
                    continue
                running, state = found
                if normalize(running) != normalize(image):
                    rows.append(("DIFFERENT", stack, container, image, running))
                elif state != "running":
                    rows.append(("NOT RUNNING", stack, container, image, state))
                else:
                    rows.append(("same", stack, container, image, running))
        extra = sorted(set(names()) - expected)

        for status, stack, container, image, running in rows:
            if status != "same":
                print(f"{status}: {stack}/{container}")
                print(f"  repo:    {image}")
                print(f"  running: {running}")
        same = sum(1 for row in rows if row[0] == "same")
        print(f"{same} of {len(rows)} containers run the image from the repo")
        for name in extra:
            print(f"NOT IN ANY FILE: {name}")
        return 0 if same == len(rows) and not extra else 1


    def main(argv=None, root=REPO, inspect=docker_inspect, names=docker_names):
        argv = sys.argv[1:] if argv is None else argv
        try:
            if len(argv) != 1 or not SERVER_NAME.fullmatch(argv[0]):
                raise UsageError("give one server name of letters, digits, - and _")
            return check(argv[0], root, inspect, names)
        except UsageError as error:
            print("usage: check_images.py SERVER", file=sys.stderr)
            print(f"error: {error}", file=sys.stderr)
            return 2


    if __name__ == "__main__":
        sys.exit(main())
    ```

### collect_state.sh

Records every container with its configured image, image ID, digests, project, start time and a hash of its environment. Two records compared field by field prove what a change did. It prints no environment value.

- When: before and after each move, merge or reboot. See [Back up and record](backup.md#record-what-runs).
- Example: `bash tools/collect_state.sh > work/before.txt`

??? example "tools/collect_state.sh"

    ```bash
    #!/usr/bin/env bash
    # collect_state.sh: record every container and the exact image it runs.
    #
    # Why: before and after a change (a move to Komodo, a merged update, a
    # reboot), two records show what really changed: which container got a new
    # image, which one restarted, and whether its environment stayed the same.
    #
    # Usage, on the server, as root or as a user in the docker group:
    #
    #   mkdir -p work
    #   bash tools/collect_state.sh > work/before.txt
    #   ... make the change ...
    #   bash tools/collect_state.sh > work/after.txt
    #
    # Output: one line per container, sorted by name, with fields split by |:
    #
    #   1 container name       5 version label (org.opencontainers.image.version)
    #   2 configured image     6 compose project
    #   3 image id             7 compose file(s)
    #   4 repo digests         8 start time
    #                          9 env hash
    #
    # For example:
    #
    #   web|ghcr.io/example/web:2.0@sha256:<digest>|sha256:<id>|ghcr.io/example/web@sha256:<digest>|2.0|app|/srv/repo/server-a/app/docker-compose.yml|2026-01-01T10:00:00Z|3f2a9c0d1e2b4a56
    #
    # To compare two records field by field (here the configured image, the
    # image id and the start time), keep the name in field 1:
    #
    #   for f in 2 3 8; do diff <(cut -d'|' -f1,$f work/before.txt) <(cut -d'|' -f1,$f work/after.txt); echo "field $f done"; done
    #
    # Field 4 is empty for a container whose tag moved to a newer image after
    # it started, so the image id in field 3 is the only proof of what it runs.
    # The env hash is the first 16 hex digits of a SHA-256 over the sorted
    # environment variables. It changes when a variable is added, removed or
    # changed, without showing any value.
    #
    # It only reads (docker inspect and docker image inspect) and changes
    # nothing. It prints no environment value, so the output is safe to share,
    # but it does show container names, images and file paths.

    docker ps -a --format '{{.Names}}' | sort | while read -r name; do
      id=$(docker inspect --format '{{.Image}}' "$name")
      digests=$(docker image inspect --format '{{join .RepoDigests ","}}' "$id" 2>/dev/null)
      version=$(docker image inspect --format '{{index .Config.Labels "org.opencontainers.image.version"}}' "$id" 2>/dev/null)
      details=$(docker inspect --format '{{.Config.Image}}|{{index .Config.Labels "com.docker.compose.project"}}|{{index .Config.Labels "com.docker.compose.project.config_files"}}|{{.State.StartedAt}}' "$name")
      env_hash=$(docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' "$name" | LC_ALL=C sort | sha256sum | cut -c1-16)
      image=${details%%|*}
      echo "$name|$image|$id|$digests|$version|${details#*|}|$env_hash"
    done
    ```

### find_literals.sh

Lists the keys of a compose file that look sensitive, as `LITERAL` (the value is in the file) or `reference` (a variable), and the long flags of commands. It prints names only.

- When: before the first split, to fill `secret_keys`, and to read each new stack file.
- Example: `bash tools/find_literals.sh < /home/docker-compose.yml`

??? example "tools/find_literals.sh"

    ```bash
    #!/usr/bin/env bash
    # find_literals.sh: list the keys of a compose file that look sensitive.
    #
    # Why: before a large compose file is split into stacks and put into Git,
    # every secret in it must move to a variable. This lists the keys whose
    # names look sensitive and says, for each, whether the file holds the
    # value itself (LITERAL) or a ${VARIABLE} (reference). The LITERAL keys
    # are the ones to add to secret_keys in the stack map.
    #
    # Usage, with the compose file on stdin:
    #
    #   bash tools/find_literals.sh < /home/docker-compose.yml
    #
    # Output: one line per hit, as "line key kind":
    #
    #   12 DB_PASSWORD LITERAL       the value is in the file
    #   13 API_TOKEN reference       the value comes from a variable
    #   40 command flags: --requirepass --appendonly
    #
    # A key counts as sensitive when its name contains one of: pass, secret,
    # token, key, webhook, discord, _url, user, auth, credential, private,
    # bearer, cookie, salt, dsn (in any case). A value with a login in a URL
    # (scheme://user:password@host) counts too, whatever the key. For
    # command:, entrypoint: and test:, it lists the long flags, so that a
    # secret flag such as --requirepass can go to secret_flags in the map.
    # Commented-out lines and keys without a value are skipped.
    #
    # It changes nothing. It prints line numbers, key names and flag names
    # only. Values never leave this script, so the output is safe to share.
    # It needs bash and awk.

    awk '
    /^[ \t]*#/ { next }
    {
      text = $0
      sub(/^[ \t]*(-[ \t]+)?["\047]?/, "", text)
      if (!match(text, /^[A-Za-z0-9_.-]+[:=]/)) next
      name = substr(text, 1, RLENGTH - 1)
      value = substr(text, RLENGTH + 1)
      if (value ~ /^[ \t]*(#.*)?$/) next

      if (name == "command" || name == "entrypoint" || name == "test") {
        flags = ""
        rest = " " value
        while (match(rest, /[ \t"\047,]--[A-Za-z][A-Za-z_-]*/)) {
          flags = flags " " substr(rest, RSTART + 1, RLENGTH - 1)
          rest = substr(rest, RSTART + RLENGTH)
        }
        print NR, name, "flags:" flags
        next
      }

      sensitive = tolower(name) ~ /pass|secret|token|key|webhook|discord|_url|user|auth|credential|private|bearer|cookie|salt|dsn/
      has_login = value ~ /:\/\/[^\/@ ]+:[^\/@ ]+@/
      if (sensitive || has_login) {
        print NR, name, (index(value, "${") ? "reference" : "LITERAL")
      }
    }
    '
    ```

### inspect-server.sh

Prints a read-only picture of a Docker host: versions, containers, networks, firewall, ports, and every compose file with its secrets masked. Host names, addresses and paths are not masked, so read the output before you share it.

- When: before you plan the move of a server you do not know well.
- Example: `bash tools/inspect-server.sh > work/inspect-server-a.txt`, or with `--check-url https://<komodo-host>/` on `server-b`.

??? example "tools/inspect-server.sh"

    ```bash
    #!/usr/bin/env bash
    # inspect-server.sh: a read-only picture of a Docker host before a migration.
    #
    # Why: before you move a server's containers into a Git repository and a
    # deployment tool, you need to know what runs there: the OS, Docker and
    # Compose versions, every container and its compose project, which
    # containers can use the Docker socket, the networks, the firewall, the open
    # ports, and every compose file with the sensitive keys in it. This script
    # prints all of that in one go, with secret values masked, so you can save
    # the output and read it (or share it) while you plan.
    #
    # Usage, on the server, as root or as a user that can use docker and read
    # the compose files:
    #
    #   bash tools/inspect-server.sh > inspect-server-a.txt
    #   bash tools/inspect-server.sh /home/docker-compose.yml /opt/other/compose.yml
    #   bash tools/inspect-server.sh --check-url https://<komodo-host>/ > inspect-server-b.txt
    #
    # Arguments:
    #
    #   COMPOSE_FILE ...   The compose files to print. Without any, the script
    #                      takes the files from the com.docker.compose.project
    #                      .config_files label of every container.
    #   --check-url URL    Also try to reach URL and print the HTTP status and
    #                      the address it reached, for example to make sure
    #                      that this server reaches a Komodo Core elsewhere.
    #
    # Sections of the output, in order: os, identity, resources, docker,
    # compose projects, containers (name|image|status|project|ports),
    # containers using the docker socket, containers on a superseded image
    # (shown by an image id instead of a name), networks, firewall (firewalld
    # or ufw), listening tcp ports, public ip (asked from 1.1.1.1), the URL
    # check if asked, git, and then one block per compose file: its size and
    # owner, the .env and override files beside it (names only), whether it is
    # in a Git repository, the sensitive-looking keys as LITERAL or reference,
    # and its contents with secrets masked. The last line is "--- end".
    #
    # Masking happens here, before any output leaves the server:
    #   - user:password@ in URLs becomes <masked>@
    #   - the value of every UPPER_CASE key in mapping form, and of every
    #     "- KEY=value" list item, becomes <masked>
    #   - --*token*, --*secret* and --*password* flag values become <masked>
    #   - a line whose key mentions pass, secret, token, apikey, auth,
    #     credential, private, bearer or cookie has its value masked
    #   - any run of 32 or more letters, digits, +, /, _ or - becomes <masked>
    #   - image: and container_name: lines and ${VARIABLE} lines stay as they are
    #
    # What is NOT masked: host names, domain names, IP addresses, user names,
    # paths and container names. Read the output before you share it, and
    # replace those by hand if they are private.
    #
    # It only reads. It changes nothing on the server. It needs bash 4 or
    # later. Missing tools (ss, firewall-cmd, ufw, curl) only leave their
    # section empty.

    check_url=""
    files=()
    while [ $# -gt 0 ]; do
      case "$1" in
        --check-url) check_url="$2"; shift 2 ;;
        -h|--help) sed -n '2,/^$/p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
        *) files+=("$1"); shift ;;
      esac
    done

    mask_secrets() {
      sed -E \
        -e '/^[[:space:]]*(image|container_name):/b' \
        -e 's#(://)[^/@[:space:]]+:[^/@[:space:]]+@#\1<masked>@#g' \
        -e '/\$\{[A-Za-z_]/b' \
        -e 's/^([[:space:]]*-[[:space:]]*"?[A-Za-z0-9_.]+=).*/\1<masked>/' \
        -e 's/^([[:space:]]+[A-Z][A-Z0-9_]+:[[:space:]]+).+/\1<masked>/' \
        -e 's/(--[a-z-]*(token|secret|password)[a-z-]*[= ]).*/\1<masked>/I' \
        -e '/(pass|secret|token|apikey|api_key|auth|credential|private|bearer|cookie)/I s/([:=][[:space:]]*).+/\1<masked>/' \
        -e 's/[A-Za-z0-9+\/_-]{32,}/<masked>/g'
    }

    echo "--- os"; . /etc/os-release 2>/dev/null && echo "$PRETTY_NAME"; uname -r
    echo "--- identity"; id -un; hostname
    echo "--- resources"; nproc 2>/dev/null; free -h 2>/dev/null | sed -n '2p'; df -h / | tail -1
    echo "--- docker"
    docker version --format 'server {{.Server.Version}}' 2>&1
    docker compose version 2>&1
    docker info --format 'root={{.DockerRootDir}} storage={{.Driver}} containers={{.Containers}} running={{.ContainersRunning}} images={{.Images}}' 2>&1
    echo "--- compose projects"
    docker compose ls -a 2>&1
    echo "--- containers"
    docker ps -a --format '{{.Names}}|{{.Image}}|{{.Status}}|{{.Label "com.docker.compose.project"}}|{{.Ports}}'
    echo "--- containers using the docker socket"
    for c in $(docker ps -q); do
      docker inspect --format '{{.Name}} {{range .Mounts}}{{.Source}} {{end}}' "$c" | grep 'docker.sock' | awk '{print $1}'
    done
    echo "--- containers on a superseded image"
    docker ps --format '{{.Names}} {{.Image}}' | grep -E ' [0-9a-f]{12}$'
    echo "--- networks"
    docker network ls --format '{{.Name}} {{.Driver}} {{.Scope}}'
    echo "--- firewall"
    systemctl is-active firewalld 2>&1
    firewall-cmd --list-all 2>/dev/null | grep -E '^\S|services:|ports:'
    ufw status 2>/dev/null | head -30
    echo "--- listening tcp ports"
    ss -tln 2>/dev/null | awk 'NR>1 {print $4}' | sort -u
    echo "--- public ip"
    curl -sS -m 5 https://1.1.1.1/cdn-cgi/trace 2>/dev/null | grep '^ip='
    if [ -n "$check_url" ]; then
      echo "--- reach $check_url"
      curl -sS -m 10 -o /dev/null -w 'http=%{http_code} ip=%{remote_ip}\n' "$check_url" 2>&1
    fi
    echo "--- git"; git --version 2>&1

    if [ ${#files[@]} -eq 0 ]; then
      # Every compose file that started a container, without duplicates.
      mapfile -t files < <(docker ps -a --format '{{.Label "com.docker.compose.project.config_files"}}' \
        | tr ',' '\n' | grep -v '^$' | sort -u)
    fi
    echo "--- compose files"; printf '%s\n' "${files[@]}"

    for f in "${files[@]}"; do
      echo
      echo "=== $f"
      if [ ! -r "$f" ]; then echo "cannot read"; continue; fi
      ls -la "$f"
      d=$(dirname "$f")
      echo "--- files beside it (names only)"; ls -a "$d" | grep -E '^\.env|\.env$|compose|override'
      echo "--- git repo?"; git -C "$d" rev-parse --is-inside-work-tree 2>&1 | head -1
      echo "--- literal or reference, for sensitive-looking keys (values never shown)"
      grep -nE '(PASS|SECRET|TOKEN|APIKEY|API_KEY|_KEY|WEBHOOK|DISCORD|_URL|DB_USER)' "$f" \
        | grep -vE '^[0-9]+:[[:space:]]*#' \
        | sed -E -e 's/^([0-9]+):[[:space:]]*-?[[:space:]]*"?([A-Za-z0-9_.-]+)[:=].*\$\{.*/\1 \2 reference/' -e 't' \
                 -e 's/^([0-9]+):[[:space:]]*-?[[:space:]]*"?([A-Za-z0-9_.-]+)[:=].*/\1 \2 LITERAL/'
      echo "--- contents (masked)"
      mask_secrets < "$f"
    done
    echo
    echo "--- end"
    ```

### scan_repo_secrets.py

Searches every tracked file and every commit of the repository for the real secret values, and prints the file and key name of each hit, never a value.

- When: before you push for the first time, after the move of each server, and whenever you are unsure.
- Example: `python3 -I tools/scan_repo_secrets.py --repo /root/<your-repo> /root/secrets-server-a.env --env-dir /home/.env_files`
- A hit in a commit means the secret is in the history of every clone: change the secret itself.
- Exit codes: 0 no hits, 1 hits, 2 wrong arguments.

??? example "tools/scan_repo_secrets.py"

    ```python
    #!/usr/bin/env python3
    """Look for secret values in a Git repository: in every tracked file and in
    every commit of every branch.

    Why
    ---
    A GitOps repository holds the compose files, and the secrets must stay out
    of it. A value that was committed once stays in the history, even after a
    later commit removes it, and anyone with a clone can read it. This tool
    takes the real secret values from the files that hold them on the server
    and searches the repository for each one. It prints names only, never a
    value, so its output is safe to share.

    It only reads. It runs `git ls-files`, `git rev-list --all` and `git show`.

    Usage
    -----
    Run it on the server that holds the secrets, in or against its clone:

        python3 -I tools/scan_repo_secrets.py --repo /root/<your-repo> /root/secrets-server-a.env
        python3 -I tools/scan_repo_secrets.py --repo /root/<your-repo> --env-dir /home/.env_files

    Arguments:

        SECRETS_FILE ...   Files of NAME='value' lines, such as the secrets file
                           that split_stacks.py writes. Every value counts as a
                           secret, except usernames (see below).
        --env-dir DIR      A folder of env files (*.env and .*.env). Only keys
                           whose names look sensitive count: pass, secret, token,
                           key, webhook, discord, _url, auth, credential, private,
                           bearer, cookie, salt or dsn, in any case.
        --repo PATH        The repository to scan. The default is the current
                           folder.
        --min-length N     Skip values shorter than N characters (default 8),
                           because short values such as "1000" match by chance.

    Give at least one SECRETS_FILE or --env-dir.

    Keys that look like usernames (user, login, email) are skipped. A username
    such as "forgejo" is often also a service name and a folder name, so it
    would match everywhere and hide the real hits.

    Values in the files may be bare, 'single-quoted' or "double-quoted", and a
    line may start with "export ". Blank lines and # comments are skipped.

    Output
    ------
        12 values checked, from 1 secrets files and 9 env files; 4 username keys skipped
        34 tracked files and 57 commits scanned
        HIT: secrets-server-a.env DB_PASSWORD in file server-a/app/docker-compose.yml
        HIT: .app.env API_TOKEN in commit 1a2b3c4
        2 hits

    A hit "in file" means that the value is in the current files: replace it
    with a variable and commit. A hit "in commit" means that the value is in the
    history (in the change or in the message of that commit). Removing it from
    the files is not enough: change the secret itself, because the old value
    stays readable in every clone.

    Exit codes: 0 no hits, 1 at least one hit, 2 wrong arguments, a file that
    cannot be read, or a folder that is not a Git repository.
    """
    import argparse
    import glob
    import os
    import re
    import subprocess
    import sys

    SENSITIVE = re.compile(
        r"pass|secret|token|key|webhook|discord|_url|auth|credential|private|bearer|cookie|salt|dsn",
        re.I,
    )
    USERNAME = re.compile(r"user|login|email", re.I)


    class ScanError(Exception):
        pass


    def parse(path):
        """Return [(name, value)] from a file of NAME=value lines."""
        pairs = []
        try:
            with open(path, encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()
        except OSError as error:
            raise ScanError(f"cannot read {path}: {error.strerror}") from None
        for line in lines:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            name, _, value = line.partition("=")
            name = name.strip()
            if name.startswith("export "):
                name = name[len("export "):].strip()
            value = value.strip()
            if len(value) >= 2 and value[0] == value[-1] and value[0] in "'\"":
                value = value[1:-1].replace("\\'", "'")
            pairs.append((name, value))
        return pairs


    def wanted(secrets_files, env_dir, min_length):
        """Return ({value: {"<file> <KEY>", ...}}, usernames skipped, env files read)."""
        values = {}
        skipped = 0
        sources = [(path, False) for path in secrets_files]
        env_files = []
        if env_dir:
            if not os.path.isdir(env_dir):
                raise ScanError(f"cannot read {env_dir}: not a folder")
            env_files = sorted(set(glob.glob(os.path.join(env_dir, ".*.env")) + glob.glob(os.path.join(env_dir, "*.env"))))
            sources += [(path, True) for path in env_files]
        for path, only_sensitive in sources:
            for name, value in parse(path):
                if USERNAME.search(name):
                    skipped += 1
                elif (not only_sensitive or SENSITIVE.search(name)) and len(value) >= min_length:
                    values.setdefault(value, set()).add(f"{os.path.basename(path)} {name}")
        return values, skipped, len(env_files)


    def git(repo, *args):
        result = subprocess.run(
            ["git", "-C", repo, *args], capture_output=True, text=True, encoding="utf-8", errors="ignore"
        )
        if result.returncode != 0:
            last = (result.stderr.strip().splitlines() or ["no message"])[-1]
            raise ScanError(f"git {args[0]} failed in {repo}: {last}")
        return result.stdout


    def report(where, text, values, hits):
        for value, names in values.items():
            if value in text:
                for name in names:
                    hits.add(f"{name} in {where}")


    def scan(repo, values):
        """Return (hits, files scanned, commits scanned)."""
        hits = set()
        files = git(repo, "ls-files").splitlines()
        for path in files:
            try:
                with open(os.path.join(repo, path), encoding="utf-8", errors="ignore") as f:
                    report(f"file {path}", f.read(), values, hits)
            except OSError:
                continue  # listed in the index but deleted in the work tree
        commits = git(repo, "rev-list", "--all").split()
        for commit in commits:
            # %B is the full message. -m shows the changes of a merge against
            # each parent, so a value added in a merge is found too.
            report(f"commit {commit[:7]}", git(repo, "show", "-m", "--format=%B", commit), values, hits)
        return sorted(hits), len(files), len(commits)


    def main(argv=None):
        parser = argparse.ArgumentParser(
            description="Look for secret values in every tracked file and every commit of a Git repository. "
            "Prints names, never values. Read the top of this file for details."
        )
        parser.add_argument("secrets_files", nargs="*", metavar="SECRETS_FILE", help="files of NAME='value' lines")
        parser.add_argument("--env-dir", help="folder of env files; only sensitive-looking keys count")
        parser.add_argument("--repo", default=".", help="the repository to scan (default: the current folder)")
        parser.add_argument("--min-length", type=int, default=8, help="skip shorter values (default: 8)")
        try:
            args = parser.parse_args(argv)
        except SystemExit as error:
            return error.code
        if not args.secrets_files and not args.env_dir:
            parser.print_usage(sys.stderr)
            print("error: give at least one SECRETS_FILE or --env-dir", file=sys.stderr)
            return 2
        try:
            values, skipped, env_count = wanted(args.secrets_files, args.env_dir, args.min_length)
            print(
                f"{len(values)} values checked, from {len(args.secrets_files)} secrets files and "
                f"{env_count} env files; {skipped} username keys skipped"
            )
            hits, files, commits = scan(args.repo, values)
        except ScanError as error:
            parser.print_usage(sys.stderr)
            print(f"error: {error}", file=sys.stderr)
            return 2
        print(f"{files} tracked files and {commits} commits scanned")
        for hit in hits:
            print(f"HIT: {hit}")
        print("no hits" if not hits else f"{len(hits)} hits")
        return 1 if hits else 0


    if __name__ == "__main__":
        sys.exit(main())
    ```

## The stack map and the pins

`split_stacks.py` reads two files for each server. [Move the stacks](move-stacks.md#write-the-stack-map) explains each key of the map, and [Back up and record](backup.md#pin-the-images) explains how to write the pins.

??? example "tools/stacks/server-a.json"

    ```json
    {
      "stacks": {
        "proxy": ["swag"],
        "media": ["sonarr", "sonarr-db", "radarr"],
        "monitoring": ["uptime-kuma"]
      },
      "skip": ["komodo-core", "komodo-mongo", "komodo-periphery"],
      "secret_keys": ["DB_PASSWORD", "POSTGRES_PASSWORD", "POSTGRES_USER", "API_TOKEN"],
      "secret_flags": ["--requirepass"],
      "scan_exempt_keys": ["POSTGRES_USER"],
      "plain_env": {"TZ": "Etc/UTC", "PUID": "1000", "PGID": "1000"},
      "network": {"key": "lab.docker", "name": "home_lab.docker"},
      "komodo_files": ["komodo/docker-compose.yml"]
    }
    ```

??? example "tools/pins/server-a.json"

    ```json
    {
      "swag": "lscr.io/linuxserver/swag:5.9.0-ls497@sha256:<digest>",
      "sonarr": "lscr.io/linuxserver/sonarr:4.0.15.2941-ls292@sha256:<digest>",
      "sonarr-db": "postgres:15-alpine@sha256:<digest>",
      "radarr": "lscr.io/linuxserver/radarr:5.26.2.10099-ls276@sha256:<digest>",
      "uptime-kuma": "louislam/uptime-kuma:1@sha256:<digest>"
    }
    ```

## Configuration files

These files hold values of your homelab, so they show placeholders. Replace each one with your own value. The Renovate files are on the [Renovate](renovate.md) page.

Keeps secrets files and working files out of Git.

??? example ".gitignore"

    ```text
    # Secrets and working files must never reach Git.
    *.env
    secrets-*
    work/

    __pycache__/
    *.pyc
    ```

Komodo Core, Mongo and the Periphery of `server-a`. Replace `<komodo-host>` with your host name, and set `TZ` to your time zone.

??? example "komodo/docker-compose.yml"

    ```yaml
    name: komodo

    # Start this project by hand. Komodo never manages it.
    #
    #   docker compose -f komodo/docker-compose.yml \
    #     --env-file /home/.env_files/.komodo.env up -d

    services:
      mongo:
        container_name: komodo-mongo
        image: mongo:8.0.34@sha256:b9924c330a8bbc5800fe9c69f04a84e221eca7b28fd049a0354147d9908fa142
        labels:
          komodo.skip: # Prevent Komodo from stopping with StopAllContainers
        command: --quiet --wiredTigerCacheSizeGB 0.25
        restart: unless-stopped
        environment:
          MONGO_INITDB_ROOT_USERNAME: ${KOMODO_DATABASE_USERNAME}
          MONGO_INITDB_ROOT_PASSWORD: ${KOMODO_DATABASE_PASSWORD}
        volumes:
          - /home/komodo/mongo/db:/data/db
          - /home/komodo/mongo/config:/data/configdb

      core:
        container_name: komodo-core
        image: ghcr.io/moghtech/komodo-core:2.3.4@sha256:91b2afd7b3bb2abea0ebd3046d65ec457eb1f3d505868d1d60cb0f8562490ef9
        labels:
          komodo.skip: # Prevent Komodo from stopping with StopAllContainers
        init: true
        restart: unless-stopped
        depends_on:
          - mongo
        ports:
          - 9120:9120
        env_file:
          - /home/.env_files/.komodo.env
        environment:
          TZ: Etc/UTC
          KOMODO_DATABASE_ADDRESS: mongo:27017
          KOMODO_HOST: https://<komodo-host>
          KOMODO_TITLE: Komodo
          KOMODO_FIRST_SERVER_NAME: server-a
          KOMODO_PERIPHERY_PUBLIC_KEY: file:/config/keys/periphery.pub
          KOMODO_LOCAL_AUTH: "true"
          KOMODO_DISABLE_USER_REGISTRATION: "true"
        volumes:
          - /home/komodo/keys:/config/keys
          - /home/komodo/backups:/backups

      periphery:
        container_name: komodo-periphery
        image: ghcr.io/moghtech/komodo-periphery:2.3.4@sha256:fb4b52961fcce7a31e3776930e422967b6640f653de876f59f26dea243e29beb
        labels:
          komodo.skip: # Prevent Komodo from stopping with StopAllContainers
        init: true
        restart: unless-stopped
        depends_on:
          - core
        environment:
          TZ: Etc/UTC
          PERIPHERY_CORE_ADDRESS: ws://core:9120
          PERIPHERY_CONNECT_AS: server-a
          PERIPHERY_CORE_PUBLIC_KEYS: file:/config/keys/core.pub
          PERIPHERY_ROOT_DIRECTORY: /home/komodo/periphery
          PERIPHERY_INCLUDE_DISK_MOUNTS: /etc/hostname
        volumes:
          - /home/komodo/keys:/config/keys
          - /var/run/docker.sock:/var/run/docker.sock
          - /proc:/proc
          # The root directory must have the same path inside and outside.
          - /home/komodo/periphery:/home/komodo/periphery
          # Compose runs in this container, so stacks read env files here.
          - /home/.env_files:/home/.env_files:ro
    ```

The names of the Komodo env file, without values.

??? example "komodo/compose.env.example"

    ```text
    # Names only. The real file is /home/.env_files/.komodo.env on server-a.
    # Never commit real values.
    KOMODO_DATABASE_USERNAME=
    KOMODO_DATABASE_PASSWORD=
    KOMODO_INIT_ADMIN_USERNAME=
    KOMODO_INIT_ADMIN_PASSWORD=
    KOMODO_WEBHOOK_SECRET=
    KOMODO_JWT_SECRET=
    ```

The Periphery of `server-b`, which connects out to Core through the restricted route.

??? example "komodo/periphery-server-b/docker-compose.yml"

    ```yaml
    name: komodo-periphery

    # Start this project by hand on server-b. Komodo never manages it.
    #
    #   docker compose -f komodo/periphery-server-b/docker-compose.yml up -d

    services:
      periphery:
        container_name: komodo-periphery
        image: ghcr.io/moghtech/komodo-periphery:2.3.4@sha256:fb4b52961fcce7a31e3776930e422967b6640f653de876f59f26dea243e29beb
        labels:
          komodo.skip: # Prevent Komodo from stopping with StopAllContainers
        init: true
        restart: unless-stopped
        # Holds the onboarding key for the first connection only.
        env_file:
          - /home/.env_files/.komodo-periphery.env
        environment:
          TZ: Etc/UTC
          PERIPHERY_CORE_ADDRESS: https://<komodo-host>
          PERIPHERY_CONNECT_AS: server-b
          PERIPHERY_CORE_PUBLIC_KEYS: file:/config/keys/core.pub
          PERIPHERY_ROOT_DIRECTORY: /home/komodo/periphery
          PERIPHERY_INCLUDE_DISK_MOUNTS: /etc/hostname
        volumes:
          - /home/komodo/keys:/config/keys
          - /var/run/docker.sock:/var/run/docker.sock
          - /proc:/proc
          # The root directory must have the same path inside and outside.
          - /home/komodo/periphery:/home/komodo/periphery
          # Compose runs in this container, so stacks read env files here.
          - /home/.env_files:/home/.env_files:ro
    ```

The restricted route on `server-a`. Replace the placeholders with your values.

??? example "komodo/swag/komodo.subdomain.conf"

    ```nginx
    ## Komodo restricted route. Copy to /home/swag/config/nginx/proxy-confs/ on server-a.
    ##
    ## server-b can reach Core on two paths only. The web interface is open to
    ## the LAN only, over HTTPS here or over HTTP at http://<server-a-lan-ip>:9120.

    server {
        listen 443 ssl;
        listen [::]:443 ssl;

        server_name komodo.*;

        include /config/nginx/ssl.conf;

        # The web interface, for the LAN only. A LAN request comes back in
        # through the router, so SWAG sees the LAN address of the router.
        # Requests from the internet keep their own address and are denied.
        location / {
            allow <lan-subnet>;
            deny all;

            proxy_pass http://<server-a-lan-ip>:9120;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Forwarded-Host $host;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
            proxy_read_timeout 1h;
        }

        # Forgejo webhooks.
        location /listener/ {
            allow <server-b-public-ip>;
            deny all;

            proxy_pass http://<server-a-lan-ip>:9120;
            proxy_set_header Host $host;
            proxy_set_header X-Forwarded-Host $host;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
        }

        # Periphery on server-b. The exact match keeps /ws/update and
        # /ws/terminal blocked. Core checks the host name during login.
        location = /ws/periphery {
            allow <server-b-public-ip>;
            deny all;

            proxy_pass http://<server-a-lan-ip>:9120;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Forwarded-Host $host;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
            proxy_read_timeout 1h;
        }
    }
    ```
