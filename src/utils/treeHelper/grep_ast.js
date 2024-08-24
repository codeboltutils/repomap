
const TreeSitter = require('tree-sitter');
const TreeSitterPython = require('tree-sitter-python');
const TreeSitterJavaScript = require('tree-sitter-javascript'); // Add more languages as needed
const TreeSitterTypeScript = require('tree-sitter-typescript').typescript


class TreeContext {
    constructor(
        filename,
        code,
        color = false,
        verbose = false,
        line_number = false,
        parent_context = true,
        child_context = true,
        last_line = true,
        margin = 3,
        mark_lois = true,
        header_max = 10,
        show_top_of_file_parent_scope = true,
        loi_pad = 1
    ) {
        try {
            
        
        this.filename = filename;
        this.color = color;
        this.verbose = verbose;
        this.line_number = line_number;
        this.last_line = last_line;
        this.margin = margin;
        this.mark_lois = mark_lois;
        this.header_max = header_max;
        this.loi_pad = loi_pad;
        this.show_top_of_file_parent_scope = show_top_of_file_parent_scope;

        this.parent_context = parent_context;
        this.child_context = child_context;

        // const lang = filename_to_lang(filename);
        // if (!lang) {
        //     throw new Error(`Unknown language for ${filename}`);
        // }
        let language = null;
        if (this.filename.endsWith('.py')) {
          language = TreeSitterPython;
        } else if (this.filename.endsWith('.js')) {
          language = TreeSitterJavaScript;
        }
        else if (this.filename.endsWith('.ts')) {
            language = TreeSitterTypeScript;
          }
        // Add more languages as needed
    
        if (!language) return [];
    
        const parser = new TreeSitter();
        parser.setLanguage(language);

        // Get parser based on file extension
        // const parser = getParser(lang);
        const tree = parser.parse(code, 'utf8');

        this.lines = code.split('\n');
        this.num_lines = this.lines.length + 1;

        // color lines, with highlighted matches
        this.output_lines = {};

        // Which scopes is each line part of?
        this.scopes = Array.from({ length: this.num_lines }, () => new Set());

        // Which lines serve as a short "header" for the scope starting on that line
        this.header = Array.from({ length: this.num_lines }, () => []);

        this.nodes = Array.from({ length: this.num_lines }, () => []);

        const rootNode = tree.rootNode;
        // console.log(rootNode);
        this.walk_tree(rootNode);

        if (this.verbose) {
            const scope_width = Math.max(...this.scopes.slice(0, -1).map(scope => scope.size.toString().length));
            for (let i = 0; i < this.num_lines; i++) {
                const header = [...this.header[i]].sort();
                if (this.verbose && i < this.num_lines - 1) {
                    const scopes = [...this.scopes[i]].sort().join(', ');
                    // console.log(`${scopes.padEnd(scope_width)} ${i} ${this.lines[i]}`);
                }

                let head_start = i;
                let head_end = i + 1;

                if (header.length > 1) {
                    const [size, start, end] = header[0];
                    if (size > this.header_max) {
                        head_end = start + this.header_max;
                    }
                }

                this.header[i] = [head_start, head_end];
            }
        }

        this.show_lines = new Set();
        this.lines_of_interest = new Set();
    } catch (error) {
            return ''
    }
    }

    grep(pat, ignore_case) {
        const found = new Set();
        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i];
            const regex = new RegExp(pat, ignore_case ? 'i' : '');
            if (regex.test(line)) {
                if (this.color) {
                    this.output_lines[i] = line.replace(regex, match => `\x1b[1;31m${match}\x1b[0m`);
                }
                found.add(i);
            }
        }
        return found;
    }

    add_lines_of_interest(line_nums) {
        line_nums.forEach(num => this.lines_of_interest.add(num));
    }

    add_context() {
        if (!this.lines_of_interest.size) {
            return;
        }

        this.done_parent_scopes = new Set();
        this.show_lines = new Set(this.lines_of_interest);

        if (this.loi_pad) {
            this.lines_of_interest.forEach(line => {
                for (let new_line = line - this.loi_pad; new_line <= line + this.loi_pad; new_line++) {
                    if (new_line >= 0 && new_line < this.num_lines) {
                        this.show_lines.add(new_line);
                    }
                }
            });
        }

        if (this.last_line) {
            const bottom_line = this.num_lines - 2;
            this.show_lines.add(bottom_line);
            this.add_parent_scopes(bottom_line);
        }

        if (this.parent_context) {
            this.lines_of_interest.forEach(line => this.add_parent_scopes(line));
        }

        if (this.child_context) {
            this.lines_of_interest.forEach(line => this.add_child_context(line));
        }

        if (this.margin) {
            for (let i = 0; i < this.margin; i++) {
                this.show_lines.add(i);
            }
        }

        this.close_small_gaps();
    }

    add_child_context(i) {
        if (!this.nodes[i].length) {
            return;
        }

        const last_line = this.get_last_line_of_scope(i);
        const size = last_line - i;
        if (size < 5) {
            for (let line = i; line <= last_line; line++) {
                this.show_lines.add(line);
            }
            return;
        }

        let children = [];
        for (const node of this.nodes[i]) {
            children = children.concat(this.find_all_children(node));
        }

        children = children.sort((a, b) => (b.endPoint[0] - b.startPoint[0]) - (a.endPoint[0] - a.startPoint[0]));

        const currently_showing = this.show_lines.size;
        // const max_to_show = 25;
        const min_to_show = 5;
        const percent_to_show = 0.10;
        const max_to_show = Math.max(Math.min(size * percent_to_show, max_to_show), min_to_show);

        for (const child of children) {
            if (this.show_lines.size > currently_showing + max_to_show) {
                break;
            }
            const child_start_line = child.startPoint[0];
            this.add_parent_scopes(child_start_line);
        }
    }

    find_all_children(node) {
        let children = [node];
        for (const child of node.children) {
            children = children.concat(this.find_all_children(child));
        }
        return children;
    }

    get_last_line_of_scope(i) {
        return Math.max(...this.nodes[i].map(node => node.endPoint[0]));
    }

    close_small_gaps() {
        const closed_show = new Set(this.show_lines);
        const sorted_show = [...this.show_lines].sort((a, b) => a - b);
        for (let i = 0; i < sorted_show.length - 1; i++) {
            if (sorted_show[i + 1] - sorted_show[i] === 2) {
                closed_show.add(sorted_show[i] + 1);
            }
        }

        for (let i = 0; i < this.lines.length; i++) {
            if (closed_show.has(i) && this.lines[i].trim() && i < this.num_lines - 2 && !this.lines[i + 1].trim()) {
                closed_show.add(i + 1);
            }
        }

        this.show_lines = closed_show;
    }

    format() {
        if (!this.show_lines.size) {
            return "";
        }

        let output = "";
        if (this.color) {
            output += "\x1b[0m\n";
        }

        let dots = !this.show_lines.has(0);
        for (let i = 0; i < this.lines.length; i++) {
            if (!this.show_lines.has(i)) {
                if (dots) {
                    output += this.line_number ? "...⋮...\n" : "⋮...\n";
                    dots = false;
                }
                continue;
            }

            const spacer = this.lines_of_interest.has(i) && this.mark_lois ? (this.color ? "\x1b[31m█\x1b[0m" : "█") : "│";
            let line_output = `${spacer}${this.output_lines[i] || this.lines[i]}`;
            if (this.line_number) {
                line_output = `${(i + 1).toString().padStart(3)}${line_output}`;
            }
            output += `${line_output}\n`;

            dots = true;
        }

        return output;
    }

    add_parent_scopes(i) {
        if (this.done_parent_scopes.has(i)) {
            return;
        }
        this.done_parent_scopes.add(i);

        for (const line_num of this.scopes[i]) {
            const [head_start, head_end] = this.header[line_num];
            if (head_start > 0 || this.show_top_of_file_parent_scope) {
                for (let line = head_start; line < head_end; line++) {
                    this.show_lines.add(line);
                }
            }

            if (this.last_line) {
                const last_line = this.get_last_line_of_scope(line_num);
                this.add_parent_scopes(last_line);
            }
        }
    }

    walk_tree(node, depth = 0) {
        // console.log(node.startPosition);
        const start_line = node.startPosition.row;
        const end_line = node.endPosition.row;
        const size = end_line - start_line;
    
        this.nodes[start_line] = this.nodes[start_line] || [];
        this.nodes[start_line].push(node);
    
        if (this.verbose && node.isNamed) {
            console.log(
                '   '.repeat(depth),
                node.type,
                `${start_line}-${end_line}=${size + 1}`,
                node.text.split('\n')[0],
                this.lines[start_line]
            );
        }
    
        if (size) {
            this.header[start_line] = this.header[start_line] || [];
            this.header[start_line].push([size, start_line, end_line]);
        }
    
        this.scopes[start_line] = this.scopes[start_line] || new Set();
        for (let i = start_line; i <= end_line; i++) {
            this.scopes[i] = this.scopes[i] || new Set();
            this.scopes[i].add(start_line);
        }
    
        for (const child of node.children) {
            this.walk_tree(child, depth + 1);
        }
    
        return [start_line, end_line];
    }
    
}

module.exports = TreeContext;
